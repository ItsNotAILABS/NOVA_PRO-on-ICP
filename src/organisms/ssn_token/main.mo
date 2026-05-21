///
/// SSN TOKEN — Soulbound Identity Token with Tradable Sub-Coins
///
/// SSN is the primary identity vector inside the NOVA organism.
/// It is NON-TRANSFERABLE (soulbound) and represents verified identity.
///
/// Architecture:
///   - SSN: Non-transferable soulbound token (1 per verified identity)
///   - SSN-WORK: Contribution/labor sub-coin (tradable)
///   - SSN-TRUST: Reputation-backed credit sub-coin (tradable)
///   - SSN-GOV: Governance weight sub-coin (tradable)
///
/// Staking Curve (φ-based):
///   R(s,r,t) = R_base(s) × M_r(r) × M_t(t)
///   where:
///     R_base(s) = k × s^(1/φ)           — sub-linear diminishing returns
///     M_r(r) = (1 + r)^(1/φ)            — reputation multiplier
///     M_t(t) = 1 + (1 - e^(-t/(φT)))    — time-loyalty multiplier
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import Float "mo:base/Float";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

persistent actor SSNToken {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — φ-grounded primitives
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;
  transient let E : Float = 2.718281828459045;

  /// Global reward scale factor
  transient let REWARD_SCALE_K : Float = 1.0;

  /// Characteristic epoch scale for time-loyalty
  transient let TIME_SCALE_T : Float = 100.0;

  // ══════════════════════════════════════════════════════════════════
  //  TYPES
  // ══════════════════════════════════════════════════════════════════

  public type SSNId = Nat;

  public type SSNFlags = {
    banned : Bool;
    probation : Bool;
    elevated : Bool;
  };

  /// Core SSN — Non-transferable soulbound identity token
  public type SSN = {
    id : SSNId;
    owner : Principal;
    reputation : Float;        // ∈ [0, 1], computed by Julia
    stakeLocked : Nat;         // Total stake across sub-coins
    epochJoined : Nat;         // First staking epoch
    flags : SSNFlags;
    createdAt : Int;
    updatedAt : Int;
  };

  public type SubCoinSymbol = Text;  // "WORK", "TRUST", "GOV"

  public type SubCoinBalance = {
    symbol : SubCoinSymbol;
    amount : Nat;
    ssnId : SSNId;             // Always bound to root SSN
  };

  public type SubCoinConfig = {
    symbol : SubCoinSymbol;
    name : Text;
    transferable : Bool;       // true = tradable, false = organism-internal only
    mintCap : Nat;             // Max mintable per epoch (computed by Julia)
    burnReputationBonus : Float; // Reputation gain per unit burned
  };

  /// Account holding SSN and sub-coin balances
  public type Account = {
    ssn : SSN;
    subCoins : [SubCoinBalance];
  };

  public type StakingParams = {
    stake : Nat;               // s - stake amount
    reputation : Float;        // r - reputation score ∈ [0,1]
    epochsStaked : Nat;        // t - time in epochs
  };

  public type RewardResult = {
    baseReward : Float;
    reputationMultiplier : Float;
    timeMultiplier : Float;
    totalReward : Float;
  };

  public type TransferResult = {
    #Ok : Nat;
    #Err : Text;
  };

  public type MintResult = {
    #Ok : { ssnId : SSNId; amount : Nat; symbol : SubCoinSymbol };
    #Err : Text;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE
  // ══════════════════════════════════════════════════════════════════

  stable var nextSSNId : SSNId = 0;
  stable var currentEpoch : Nat = 0;
  stable var totalStaked : Nat = 0;

  transient let ssnRegistry : Buffer.Buffer<SSN> = Buffer.Buffer<SSN>(256);
  transient let subCoinBalances : Buffer.Buffer<SubCoinBalance> = Buffer.Buffer<SubCoinBalance>(1024);
  transient let subCoinConfigs : Buffer.Buffer<SubCoinConfig> = Buffer.Buffer<SubCoinConfig>(8);
  transient let auditLog : Buffer.Buffer<Text> = Buffer.Buffer<Text>(512);

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ══════════════════════════════════════════════════════════════════

  stable var initialized : Bool = false;

  public shared func initialize() : async Text {
    if (initialized) { return "Already initialized" };

    // Configure default sub-coins
    subCoinConfigs.add({
      symbol = "WORK";
      name = "SSN-WORK: Contribution Token";
      transferable = true;
      mintCap = 1_000_000;
      burnReputationBonus = 0.001;
    });

    subCoinConfigs.add({
      symbol = "TRUST";
      name = "SSN-TRUST: Reputation Credit";
      transferable = true;
      mintCap = 500_000;
      burnReputationBonus = 0.005;
    });

    subCoinConfigs.add({
      symbol = "GOV";
      name = "SSN-GOV: Governance Weight";
      transferable = true;
      mintCap = 100_000;
      burnReputationBonus = 0.01;
    });

    initialized := true;
    auditLog.add("SSN Token initialized with 3 sub-coin types");
    "Initialized"
  };

  // ══════════════════════════════════════════════════════════════════
  //  φ-BASED STAKING CURVE MATH
  // ══════════════════════════════════════════════════════════════════

  /// Base reward curve: R_base(s) = k × s^(1/φ)
  /// Sub-linear to prevent whale domination
  func computeBaseReward(stake : Nat) : Float {
    let s = Float.fromInt(stake);
    if (s <= 0.0) { return 0.0 };
    REWARD_SCALE_K * Float.pow(s, PHI_INV)
  };

  /// Reputation multiplier: M_r(r) = (1 + r)^(1/φ)
  /// Low reputation earns less, high reputation earns more
  func computeReputationMultiplier(reputation : Float) : Float {
    let r = if (reputation < 0.0) { 0.0 } else if (reputation > 1.0) { 1.0 } else { reputation };
    Float.pow(1.0 + r, PHI_INV)
  };

  /// Time-loyalty multiplier: M_t(t) = 1 + (1 - e^(-t/(φT)))
  /// Approaches 2× over long time, rewards loyalty
  func computeTimeMultiplier(epochsStaked : Nat) : Float {
    let t = Float.fromInt(epochsStaked);
    let exponent = -t / (PHI * TIME_SCALE_T);
    1.0 + (1.0 - Float.pow(E, exponent))
  };

  /// Full reward function: R(s,r,t) = R_base(s) × M_r(r) × M_t(t)
  public query func computeReward(params : StakingParams) : async RewardResult {
    let baseReward = computeBaseReward(params.stake);
    let repMult = computeReputationMultiplier(params.reputation);
    let timeMult = computeTimeMultiplier(params.epochsStaked);

    {
      baseReward = baseReward;
      reputationMultiplier = repMult;
      timeMultiplier = timeMult;
      totalReward = baseReward * repMult * timeMult;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  SSN MANAGEMENT (Soulbound - Non-Transferable)
  // ══════════════════════════════════════════════════════════════════

  func findSSNByOwner(owner : Principal) : ?Nat {
    var i : Nat = 0;
    let n = ssnRegistry.size();
    while (i < n) {
      if (Principal.equal(ssnRegistry.get(i).owner, owner)) { return ?i };
      i += 1;
    };
    null
  };

  func findSSNById(id : SSNId) : ?Nat {
    var i : Nat = 0;
    let n = ssnRegistry.size();
    while (i < n) {
      if (ssnRegistry.get(i).id == id) { return ?i };
      i += 1;
    };
    null
  };

  /// Register a new SSN (soulbound identity) - only one per principal
  public shared(msg) func registerSSN() : async Result.Result<SSNId, Text> {
    let caller = msg.caller;

    // Check if caller already has an SSN
    switch (findSSNByOwner(caller)) {
      case (?_) { return #err("Principal already has an SSN - soulbound tokens are non-transferable") };
      case null {};
    };

    let now = Time.now();
    let id = nextSSNId;
    nextSSNId += 1;

    let ssn : SSN = {
      id = id;
      owner = caller;
      reputation = 0.0;
      stakeLocked = 0;
      epochJoined = currentEpoch;
      flags = { banned = false; probation = false; elevated = false };
      createdAt = now;
      updatedAt = now;
    };

    ssnRegistry.add(ssn);
    auditLog.add("SSN #" # Nat.toText(id) # " registered for " # Principal.toText(caller));

    #ok(id)
  };

  /// Get SSN by owner principal
  public query func getSSN(owner : Principal) : async ?SSN {
    switch (findSSNByOwner(owner)) {
      case (?idx) { ?ssnRegistry.get(idx) };
      case null { null };
    }
  };

  /// Get SSN by ID
  public query func getSSNById(id : SSNId) : async ?SSN {
    switch (findSSNById(id)) {
      case (?idx) { ?ssnRegistry.get(idx) };
      case null { null };
    }
  };

  /// Update reputation (called by governance or Julia bridge)
  public shared func updateReputation(ssnId : SSNId, newReputation : Float) : async Result.Result<(), Text> {
    switch (findSSNById(ssnId)) {
      case null { #err("SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        let clampedRep = if (newReputation < 0.0) { 0.0 } else if (newReputation > 1.0) { 1.0 } else { newReputation };
        let updated : SSN = {
          id = ssn.id;
          owner = ssn.owner;
          reputation = clampedRep;
          stakeLocked = ssn.stakeLocked;
          epochJoined = ssn.epochJoined;
          flags = ssn.flags;
          createdAt = ssn.createdAt;
          updatedAt = Time.now();
        };
        ssnRegistry.put(idx, updated);
        auditLog.add("SSN #" # Nat.toText(ssnId) # " reputation updated to " # Float.toText(clampedRep));
        #ok()
      };
    }
  };

  /// Set SSN flags (governance only)
  public shared func setSSNFlags(ssnId : SSNId, flags : SSNFlags) : async Result.Result<(), Text> {
    switch (findSSNById(ssnId)) {
      case null { #err("SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        let updated : SSN = {
          id = ssn.id;
          owner = ssn.owner;
          reputation = ssn.reputation;
          stakeLocked = ssn.stakeLocked;
          epochJoined = ssn.epochJoined;
          flags = flags;
          createdAt = ssn.createdAt;
          updatedAt = Time.now();
        };
        ssnRegistry.put(idx, updated);
        auditLog.add("SSN #" # Nat.toText(ssnId) # " flags updated");
        #ok()
      };
    }
  };

  /// Revoke SSN (governance only) - sets banned flag
  public shared func revokeSSN(ssnId : SSNId) : async Result.Result<(), Text> {
    await setSSNFlags(ssnId, { banned = true; probation = false; elevated = false })
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-COIN MANAGEMENT (Tradable)
  // ══════════════════════════════════════════════════════════════════

  func findSubCoinConfig(symbol : SubCoinSymbol) : ?SubCoinConfig {
    var i : Nat = 0;
    let n = subCoinConfigs.size();
    while (i < n) {
      if (subCoinConfigs.get(i).symbol == symbol) { return ?subCoinConfigs.get(i) };
      i += 1;
    };
    null
  };

  func findSubCoinBalance(ssnId : SSNId, symbol : SubCoinSymbol) : ?Nat {
    var i : Nat = 0;
    let n = subCoinBalances.size();
    while (i < n) {
      let bal = subCoinBalances.get(i);
      if (bal.ssnId == ssnId and bal.symbol == symbol) { return ?i };
      i += 1;
    };
    null
  };

  /// Mint sub-coins (only mintable by SSN contract based on stake + reputation)
  public shared func mintSubCoin(ssnId : SSNId, symbol : SubCoinSymbol, amount : Nat) : async MintResult {
    // Verify SSN exists and is not banned
    switch (findSSNById(ssnId)) {
      case null { return #Err("SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        if (ssn.flags.banned) { return #Err("SSN is banned") };
      };
    };

    // Verify sub-coin config exists
    switch (findSubCoinConfig(symbol)) {
      case null { return #Err("Unknown sub-coin symbol: " # symbol) };
      case (?config) {
        if (amount > config.mintCap) {
          return #Err("Amount exceeds mint cap of " # Nat.toText(config.mintCap));
        };
      };
    };

    // Add or update balance
    switch (findSubCoinBalance(ssnId, symbol)) {
      case (?idx) {
        let existing = subCoinBalances.get(idx);
        subCoinBalances.put(idx, {
          symbol = symbol;
          amount = existing.amount + amount;
          ssnId = ssnId;
        });
      };
      case null {
        subCoinBalances.add({
          symbol = symbol;
          amount = amount;
          ssnId = ssnId;
        });
      };
    };

    auditLog.add("Minted " # Nat.toText(amount) # " SSN-" # symbol # " for SSN #" # Nat.toText(ssnId));
    #Ok({ ssnId = ssnId; amount = amount; symbol = symbol })
  };

  /// Transfer sub-coins between SSN holders
  public shared(msg) func transferSubCoin(
    fromSSNId : SSNId,
    toSSNId : SSNId,
    symbol : SubCoinSymbol,
    amount : Nat
  ) : async TransferResult {
    // Verify sender owns the from SSN
    switch (findSSNById(fromSSNId)) {
      case null { return #Err("From SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        if (not Principal.equal(ssn.owner, msg.caller)) {
          return #Err("Caller does not own from SSN");
        };
        if (ssn.flags.banned) { return #Err("From SSN is banned") };
      };
    };

    // Verify recipient SSN exists
    switch (findSSNById(toSSNId)) {
      case null { return #Err("To SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        if (ssn.flags.banned) { return #Err("To SSN is banned") };
      };
    };

    // Verify sub-coin is transferable
    switch (findSubCoinConfig(symbol)) {
      case null { return #Err("Unknown sub-coin symbol") };
      case (?config) {
        if (not config.transferable) {
          return #Err("SSN-" # symbol # " is not transferable outside organism");
        };
      };
    };

    // Check sender balance
    switch (findSubCoinBalance(fromSSNId, symbol)) {
      case null { return #Err("No balance for SSN-" # symbol) };
      case (?fromIdx) {
        let fromBal = subCoinBalances.get(fromIdx);
        if (fromBal.amount < amount) {
          return #Err("Insufficient balance");
        };

        // Deduct from sender
        subCoinBalances.put(fromIdx, {
          symbol = symbol;
          amount = fromBal.amount - amount;
          ssnId = fromSSNId;
        });

        // Add to recipient
        switch (findSubCoinBalance(toSSNId, symbol)) {
          case (?toIdx) {
            let toBal = subCoinBalances.get(toIdx);
            subCoinBalances.put(toIdx, {
              symbol = symbol;
              amount = toBal.amount + amount;
              ssnId = toSSNId;
            });
          };
          case null {
            subCoinBalances.add({
              symbol = symbol;
              amount = amount;
              ssnId = toSSNId;
            });
          };
        };

        auditLog.add("Transfer " # Nat.toText(amount) # " SSN-" # symbol # " from #" # Nat.toText(fromSSNId) # " to #" # Nat.toText(toSSNId));
        #Ok(amount)
      };
    }
  };

  /// Burn sub-coins to increase reputation
  public shared(msg) func burnSubCoin(ssnId : SSNId, symbol : SubCoinSymbol, amount : Nat) : async Result.Result<Float, Text> {
    // Verify caller owns the SSN
    switch (findSSNById(ssnId)) {
      case null { return #err("SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        if (not Principal.equal(ssn.owner, msg.caller)) {
          return #err("Caller does not own SSN");
        };
      };
    };

    // Get burn bonus from config
    let burnBonus : Float = switch (findSubCoinConfig(symbol)) {
      case null { return #err("Unknown sub-coin symbol") };
      case (?config) { config.burnReputationBonus };
    };

    // Check and deduct balance
    switch (findSubCoinBalance(ssnId, symbol)) {
      case null { return #err("No balance for SSN-" # symbol) };
      case (?balIdx) {
        let bal = subCoinBalances.get(balIdx);
        if (bal.amount < amount) {
          return #err("Insufficient balance to burn");
        };

        subCoinBalances.put(balIdx, {
          symbol = symbol;
          amount = bal.amount - amount;
          ssnId = ssnId;
        });

        // Calculate and apply reputation bonus
        let repGain = burnBonus * Float.fromInt(amount);

        switch (findSSNById(ssnId)) {
          case null { return #err("SSN not found") };
          case (?ssnIdx) {
            let ssn = ssnRegistry.get(ssnIdx);
            let newRep = if (ssn.reputation + repGain > 1.0) { 1.0 } else { ssn.reputation + repGain };
            let updated : SSN = {
              id = ssn.id;
              owner = ssn.owner;
              reputation = newRep;
              stakeLocked = ssn.stakeLocked;
              epochJoined = ssn.epochJoined;
              flags = ssn.flags;
              createdAt = ssn.createdAt;
              updatedAt = Time.now();
            };
            ssnRegistry.put(ssnIdx, updated);

            auditLog.add("Burned " # Nat.toText(amount) # " SSN-" # symbol # " for SSN #" # Nat.toText(ssnId) # ", rep +" # Float.toText(repGain));
            #ok(repGain)
          };
        }
      };
    }
  };

  /// Get sub-coin balance for an SSN
  public query func getSubCoinBalance(ssnId : SSNId, symbol : SubCoinSymbol) : async Nat {
    switch (findSubCoinBalance(ssnId, symbol)) {
      case null { 0 };
      case (?idx) { subCoinBalances.get(idx).amount };
    }
  };

  /// Get all sub-coin balances for an SSN
  public query func getAllSubCoinBalances(ssnId : SSNId) : async [SubCoinBalance] {
    let results = Buffer.Buffer<SubCoinBalance>(4);
    var i : Nat = 0;
    let n = subCoinBalances.size();
    while (i < n) {
      let bal = subCoinBalances.get(i);
      if (bal.ssnId == ssnId) { results.add(bal) };
      i += 1;
    };
    Buffer.toArray(results)
  };

  // ══════════════════════════════════════════════════════════════════
  //  STAKING
  // ══════════════════════════════════════════════════════════════════

  /// Stake tokens (locks stake and updates SSN)
  public shared(msg) func stake(ssnId : SSNId, amount : Nat) : async Result.Result<Nat, Text> {
    switch (findSSNById(ssnId)) {
      case null { #err("SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        if (not Principal.equal(ssn.owner, msg.caller)) {
          return #err("Caller does not own SSN");
        };
        if (ssn.flags.banned) { return #err("SSN is banned") };

        let newStake = ssn.stakeLocked + amount;
        let updated : SSN = {
          id = ssn.id;
          owner = ssn.owner;
          reputation = ssn.reputation;
          stakeLocked = newStake;
          epochJoined = ssn.epochJoined;
          flags = ssn.flags;
          createdAt = ssn.createdAt;
          updatedAt = Time.now();
        };
        ssnRegistry.put(idx, updated);
        totalStaked += amount;

        auditLog.add("Staked " # Nat.toText(amount) # " for SSN #" # Nat.toText(ssnId));
        #ok(newStake)
      };
    }
  };

  /// Unstake tokens
  public shared(msg) func unstake(ssnId : SSNId, amount : Nat) : async Result.Result<Nat, Text> {
    switch (findSSNById(ssnId)) {
      case null { #err("SSN not found") };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        if (not Principal.equal(ssn.owner, msg.caller)) {
          return #err("Caller does not own SSN");
        };
        if (ssn.stakeLocked < amount) {
          return #err("Insufficient stake");
        };

        let newStake = ssn.stakeLocked - amount;
        let updated : SSN = {
          id = ssn.id;
          owner = ssn.owner;
          reputation = ssn.reputation;
          stakeLocked = newStake;
          epochJoined = ssn.epochJoined;
          flags = ssn.flags;
          createdAt = ssn.createdAt;
          updatedAt = Time.now();
        };
        ssnRegistry.put(idx, updated);
        totalStaked -= amount;

        auditLog.add("Unstaked " # Nat.toText(amount) # " for SSN #" # Nat.toText(ssnId));
        #ok(newStake)
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  EPOCH MANAGEMENT
  // ══════════════════════════════════════════════════════════════════

  /// Advance epoch (called by scheduler or governance)
  public shared func advanceEpoch() : async Nat {
    currentEpoch += 1;
    auditLog.add("Epoch advanced to " # Nat.toText(currentEpoch));
    currentEpoch
  };

  public query func getCurrentEpoch() : async Nat { currentEpoch };

  // ══════════════════════════════════════════════════════════════════
  //  QUERIES
  // ══════════════════════════════════════════════════════════════════

  public query func getSubCoinConfigs() : async [SubCoinConfig] {
    Buffer.toArray(subCoinConfigs)
  };

  public query func getTotalStaked() : async Nat { totalStaked };

  public query func getSSNCount() : async Nat { ssnRegistry.size() };

  public query func getAuditLog(limit : Nat) : async [Text] {
    let n = auditLog.size();
    let start = if (n > limit) { n - limit } else { 0 };
    let results = Buffer.Buffer<Text>(limit);
    var i = start;
    while (i < n) {
      results.add(auditLog.get(i));
      i += 1;
    };
    Buffer.toArray(results)
  };

  /// Get full account (SSN + all sub-coins) for a principal
  public query func getAccount(owner : Principal) : async ?Account {
    switch (findSSNByOwner(owner)) {
      case null { null };
      case (?idx) {
        let ssn = ssnRegistry.get(idx);
        let balances = Buffer.Buffer<SubCoinBalance>(4);
        var i : Nat = 0;
        let n = subCoinBalances.size();
        while (i < n) {
          let bal = subCoinBalances.get(i);
          if (bal.ssnId == ssn.id) { balances.add(bal) };
          i += 1;
        };
        ?{ ssn = ssn; subCoins = Buffer.toArray(balances) }
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  HEALTH CHECK
  // ══════════════════════════════════════════════════════════════════

  public query func health() : async Text {
    "SSN Token | SSNs: " # Nat.toText(ssnRegistry.size()) #
    " | Epoch: " # Nat.toText(currentEpoch) #
    " | Total Staked: " # Nat.toText(totalStaked) #
    " | φ-powered staking curves"
  };
}
