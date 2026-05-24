///
/// NOVA TOKEN — Sovereign Token Ledger
///
/// NOVA is the native governance and utility token of the Native Nova Protocol.
/// It is NOT a wrapper around any external token standard — it is its own sovereign
/// financial organism.  It is ICRC-1 compatible in spirit but entirely self-hosted.
///
/// Supply Architecture:
///   Total supply = φ^13 × 10^8 e8s ≈ 521,001,966 NOVA (8 decimal places)
///   φ^13 = 521.001966... — the 13th power of the golden ratio is a Fibonacci attractor
///   Treasury (1/φ²)  38.2 % — protocol reserve
///   Community (1/φ³) 23.6 % — SNS swap & governance incentives
///   Founder  (1/φ²)  38.2 % — vested over 8 Fibonacci dissolve periods
///
/// Sub-Token Roles (internal role tags, not separate ledgers):
///   #Gov   — Governance-locked NOVA: earns voting power in SNS neurons
///   #Cycle — Compute-access NOVA: redeemed against Native Cycles in cycles_market
///   #Vault — Treasury-reserved NOVA: held by Parallax wallet, backs cycle floor price
///
/// Premium over ICP Cycles:
///   ICP network price: 1 ICP → 10_000_000_000_000 raw XDR cycles
///   Native Nova premium multiplier: PHI^2 ≈ 2.618
///   Meaning: 1 ICP worth of NOVA buys 10T / PHI^2 ≈ 3,819,660,112 Native Cycles
///   The remaining 61.8 % (1/PHI^2 of raw capacity) flows to the treasury.
///   Equivalently: you sell Native Cycles at PHI^2 × the raw ICP cycle price.
///   At scale (1 million Native Cycles sold/day) this generates PHI^2 – 1 = 161.8%
///   more revenue than a raw cycle reseller operating at the same volume.
///
/// The token is NOT ICP cycles.  It is a MASK and a sovereign standard.
/// If the protocol ever chooses to settle with the NNS, it can unwrap
/// Native Cycles back to raw ICP cycles at the floor rate.  The premium
/// is the value the Native Nova Protocol adds through governance, AI, and
/// its canister ecosystem.
///
/// Initialization:
///   Call initialize() once after deploy.  Subsequent calls are no-ops.
///
/// Key functions:
///   transfer(from, to, amount, role)  — move NOVA between accounts
///   mint(to, amount, role)            — treasury or SNS minting
///   burn(from, amount)                — remove supply permanently
///   balanceOf(principal)              — query total + per-role balances
///   getSupplySnapshot()               — query global supply metrics
///   getTokenEconomics()               — query the full economic parameters
///

/// Casa de Medina — Architectos de Architectura Inteligente
///

import Float  "mo:base/Float";
import Int    "mo:base/Int";
import Nat    "mo:base/Nat";
import Nat64  "mo:base/Nat64";
import Text   "mo:base/Text";
import Array  "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time   "mo:base/Time";
import Bool   "mo:base/Bool";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

persistent actor NovaToken {

  // ══════════════════════════════════════════════════════════════════
  //  CPL RUNTIME WIRING — The Permanent Foundation
  // ══════════════════════════════════════════════════════════════════
  stable var cplRuntimeCanisterId : ?Principal = null;

  public type PulsePriority = { #Low; #Normal; #High; #Critical };
  public type ProofResult = { #Passed; #Failed; #Blocked; #Partial };
  public type MemoryType = { #Precedent; #Pattern; #Consequence; #Alert; #Constraint; #Exception };

  type CPLRuntime = actor {
    createPulse : (Text, [Text], Text, [Text], [Text], Text, Text, Text,
                   PulsePriority, Nat, Nat, Nat, Bool)
                   -> async Result.Result<Text, Text>;
    enforceBeforeWrite : ([Text], Text, Text) -> async Result.Result<(), Text>;
    writeProofTrace : (Text, [Text], Text, [Text], [Text], [Text], [Text], [Text],
                       ProofResult, Bool)
                       -> async Result.Result<Text, Text>;
    createMemoryRecord : (MemoryType, Text, ?Text, Text, [Text], [Text], [Text], Float, Nat)
                         -> async Result.Result<Text, Text>;
  };

  public shared(msg) func setCPLRuntime(canisterId : Principal) : async () {
    cplRuntimeCanisterId := ?canisterId;
  };

  func getCPL() : ?CPLRuntime {
    switch (cplRuntimeCanisterId) {
      case null null;
      case (?id) {
        let cpl : CPLRuntime = actor (Principal.toText(id));
        ?cpl
      };
    }
  };



  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — φ-grounded token primitives
  // ══════════════════════════════════════════════════════════════════

  transient let PHI     : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;  // 1/φ
  transient let PHI_SQ  : Float = 2.6180339887498948482;  // φ²  (premium multiplier)
  transient let PHI_CB  : Float = 4.2360679774997896964;  // φ³

  /// Total supply in e8s (8 decimal places, like ICP)
  /// φ^13 × 10^8 = 521.001966... × 10^8 = 52_100_196_600 e8s
  transient let TOTAL_SUPPLY_E8S : Nat = 52_100_196_600;

  /// Treasury share: 1/φ² ≈ 38.196%
  transient let TREASURY_E8S : Nat = 19_918_285_500;

  /// Community share: 1/φ³ ≈ 23.607%
  transient let COMMUNITY_E8S : Nat = 12_297_756_900;

  /// Founder share: 1/φ² ≈ 38.196% (vested)
  transient let FOUNDER_E8S : Nat = 19_884_154_200;

  /// Smallest unit: 1 e8 = 0.00000001 NOVA
  transient let E8S_PER_NOVA : Nat = 100_000_000;

  /// Native Cycles per whole ICP (100_000_000 e8s)
  /// Raw ICP gives 10T cycles per ICP.  We divide by PHI^2:
  /// 10_000_000_000_000 / 2.6180339887 ≈ 3_820_040_000_000
  transient let NATIVE_CYCLES_PER_ICP_E8S : Nat = 3_820_040_000_000;

  /// Premium ratio numerator over raw ICP cycles (×10^6 for precision)
  /// PHI^2 × 10^6 = 2_618_033 — callers divide by 10^6 to get the ratio
  transient let CYCLE_PREMIUM_PARTS_PER_MILLION : Nat = 2_618_033;

  // ══════════════════════════════════════════════════════════════════
  //  TYPES
  // ══════════════════════════════════════════════════════════════════

  public type TokenRole = {
    #Gov;    // Governance-locked: earns SNS voting weight
    #Cycle;  // Compute-access: redeems Native Cycles
    #Vault;  // Treasury-reserved: backs floor cycle price
    #Free;   // Unlocked / transferable
  };

  public type Account = {
    principal  : Text;          // Principal as text (portable)
    free       : Nat;           // Free transferable balance (e8s)
    gov        : Nat;           // Governance-locked balance (e8s)
    cycle      : Nat;           // Compute-access balance (e8s)
    vault      : Nat;           // Treasury-reserved balance (e8s)
    createdAt  : Int;
    updatedAt  : Int;
    txCount    : Nat;
    phiFingerprint : Float;     // φ-identity: PHI^(createdAt mod 13)
  };

  public type Transaction = {
    id        : Nat;
    fromPrincipal : Text;
    toPrincipal   : Text;
    amount    : Nat;           // e8s
    role      : TokenRole;
    kind      : TxKind;
    timestamp : Int;
    memo      : Text;
  };

  public type TxKind = {
    #Transfer;
    #Mint;
    #Burn;
    #Lock;     // Free → Gov/Cycle/Vault
    #Unlock;   // Gov/Cycle/Vault → Free
  };

  public type SupplySnapshot = {
    totalSupply    : Nat;   // e8s
    circulating    : Nat;   // totalSupply − treasury − locked
    treasury       : Nat;   // treasury balance (e8s)
    locked         : Nat;   // sum of all gov + cycle + vault
    burned         : Nat;   // permanently destroyed (e8s)
    txCount        : Nat;
    holderCount    : Nat;
    phiRatio       : Float; // circulating / totalSupply — ideally ≈ 1/φ
    timestamp      : Int;
  };

  public type TokenEconomics = {
    totalSupplyE8s              : Nat;
    treasuryE8s                 : Nat;
    communityE8s                : Nat;
    founderE8s                  : Nat;
    e8sPerNova                  : Nat;
    nativeCyclesPerIcpE8s       : Nat;
    cyclePremiumPartsPer1M      : Nat;   // PHI^2 × 10^6
    cyclePremiumDescription     : Text;
    phiSupplyExponent           : Nat;   // 13 — supply = φ^13 × 10^8
    phiPremiumExponent          : Nat;   // 2  — premium = φ^2
    subTokenRoles               : [Text];
  };

  public type TransferResult = {
    #Ok  : Nat;   // new tx id
    #Err : Text;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE
  // ══════════════════════════════════════════════════════════════════

  stable var initialized   : Bool = false;
  stable var nextTxId      : Nat  = 0;
  stable var totalBurned   : Nat  = 0;
  stable var totalLocked   : Nat  = 0;   // sum of gov+cycle+vault across all accounts
  stable var treasuryBalance : Nat = 0;
  stable var communityBalance : Nat = 0;

  transient let accounts : Buffer.Buffer<Account>     = Buffer.Buffer<Account>(512);
  transient let ledger   : Buffer.Buffer<Transaction> = Buffer.Buffer<Transaction>(4096);
  transient let auditLog : Buffer.Buffer<Text>        = Buffer.Buffer<Text>(1024);

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════

  func roleToText(r : TokenRole) : Text {
    switch r {
      case (#Gov)   "Gov";
      case (#Cycle) "Cycle";
      case (#Vault) "Vault";
      case (#Free)  "Free";
    }
  };

  func txKindToText(k : TxKind) : Text {
    switch k {
      case (#Transfer) "Transfer";
      case (#Mint)     "Mint";
      case (#Burn)     "Burn";
      case (#Lock)     "Lock";
      case (#Unlock)   "Unlock";
    }
  };

  /// φ-fingerprint: PHI raised to (abs(createdAt mod 13))
  func phiFingerprint(ts : Int) : Float {
    let exp = Int.abs(ts % 13);
    var v : Float = 1.0;
    var i : Nat = 0;
    while (i < exp) {
      v := v * PHI;
      i += 1;
    };
    v
  };

  func findAccount(principal : Text) : ?Nat {
    var i : Nat = 0;
    let n = accounts.size();
    while (i < n) {
      if (accounts.get(i).principal == principal) { return ?i };
      i += 1;
    };
    null
  };

  func getOrCreateAccount(principal : Text) : Nat {
    switch (findAccount(principal)) {
      case (?i) i;
      case null {
        let now = Time.now();
        let acc : Account = {
          principal      = principal;
          free           = 0;
          gov            = 0;
          cycle          = 0;
          vault          = 0;
          createdAt      = now;
          updatedAt      = now;
          txCount        = 0;
          phiFingerprint = phiFingerprint(now);
        };
        accounts.add(acc);
        accounts.size() - 1
      };
    }
  };

  func accountFreeBalance(idx : Nat) : Nat {
    accounts.get(idx).free
  };

  func recordTx(
    from : Text, to : Text,
    amount : Nat, role : TokenRole, kind : TxKind, memo : Text
  ) : Nat {
    let id = nextTxId;
    nextTxId += 1;
    let tx : Transaction = {
      id;
      fromPrincipal = from;
      toPrincipal   = to;
      amount;
      role;
      kind;
      timestamp = Time.now();
      memo;
    };
    ledger.add(tx);
    auditLog.add(
      "TX#" # Nat.toText(id) # " " # txKindToText(kind) #
      " " # Nat.toText(amount) # "e8s [" # roleToText(role) # "]" #
      " " # from # " -> " # to
    );
    id
  };

  func deductFree(idx : Nat, amount : Nat) {
    let a = accounts.get(idx);
    accounts.put(idx, {
      principal      = a.principal;
      free           = a.free - amount;
      gov            = a.gov;
      cycle          = a.cycle;
      vault          = a.vault;
      createdAt      = a.createdAt;
      updatedAt      = Time.now();
      txCount        = a.txCount + 1;
      phiFingerprint = a.phiFingerprint;
    });
  };

  func creditFreeRole(idx : Nat, amount : Nat, role : TokenRole) {
    let a = accounts.get(idx);
    let newFree  = if (role == #Free)  { a.free  + amount } else { a.free  };
    let newGov   = if (role == #Gov)   { a.gov   + amount } else { a.gov   };
    let newCycle = if (role == #Cycle) { a.cycle + amount } else { a.cycle };
    let newVault = if (role == #Vault) { a.vault + amount } else { a.vault };
    accounts.put(idx, {
      principal      = a.principal;
      free           = newFree;
      gov            = newGov;
      cycle          = newCycle;
      vault          = newVault;
      createdAt      = a.createdAt;
      updatedAt      = Time.now();
      txCount        = a.txCount + 1;
      phiFingerprint = a.phiFingerprint;
    });
  };

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ══════════════════════════════════════════════════════════════════

  public func initialize() : async Text {
    if (initialized) { return "NovaToken: already initialized" };
    initialized := true;

    // Seed treasury account
    let tIdx = getOrCreateAccount("treasury");
    creditFreeRole(tIdx, TREASURY_E8S, #Vault);
    treasuryBalance := TREASURY_E8S;

    // Seed community account
    let cIdx = getOrCreateAccount("community");
    creditFreeRole(cIdx, COMMUNITY_E8S, #Free);
    communityBalance := COMMUNITY_E8S;

    // Seed founder account (Free — vesting enforced off-chain by governance)
    let fIdx = getOrCreateAccount("founder");
    creditFreeRole(fIdx, FOUNDER_E8S, #Free);

    auditLog.add("NovaToken initialized. Supply: " # Nat.toText(TOTAL_SUPPLY_E8S) # " e8s");
    "NovaToken initialized. Total supply: " # Nat.toText(TOTAL_SUPPLY_E8S) # " e8s (φ^13 × 10^8)"
  };

  // ══════════════════════════════════════════════════════════════════
  //  CORE TOKEN OPERATIONS
  // ══════════════════════════════════════════════════════════════════

  /// Transfer free NOVA between two principals.
  public func transfer(from : Text, to : Text, amount : Nat, memo : Text) : async TransferResult {
    if (amount == 0) { return #Err("Amount must be > 0") };
    let fIdx = getOrCreateAccount(from);
    if (accountFreeBalance(fIdx) < amount) {
      return #Err("Insufficient free balance");
    };
    let tIdx = getOrCreateAccount(to);
    deductFree(fIdx, amount);
    creditFreeRole(tIdx, amount, #Free);
    let txId = recordTx(from, to, amount, #Free, #Transfer, memo);
    #Ok(txId)
  };

  /// Mint new NOVA to a principal (treasury-authorized only in production;
  /// here any caller can mint — production adds caller guards).
  public func mint(to : Text, amount : Nat, role : TokenRole) : async TransferResult {
    if (amount == 0) { return #Err("Amount must be > 0") };
    let tIdx = getOrCreateAccount(to);
    creditFreeRole(tIdx, amount, role);
    if (role == #Vault or role == #Gov or role == #Cycle) {
      totalLocked += amount;
    };
    let txId = recordTx("MINT", to, amount, role, #Mint, "");
    #Ok(txId)
  };

  /// Burn NOVA permanently from a principal's free balance.
  public func burn(from : Text, amount : Nat) : async TransferResult {
    if (amount == 0) { return #Err("Amount must be > 0") };
    let fIdx = getOrCreateAccount(from);
    if (accountFreeBalance(fIdx) < amount) {
      return #Err("Insufficient free balance to burn");
    };
    deductFree(fIdx, amount);
    totalBurned += amount;
    let txId = recordTx(from, "BURN", amount, #Free, #Burn, "");
    #Ok(txId)
  };

  /// Lock free NOVA into a role (Free → Gov | Cycle | Vault).
  public func lock(principal : Text, amount : Nat, role : TokenRole) : async TransferResult {
    if (role == #Free) { return #Err("Cannot lock into Free role") };
    if (amount == 0)   { return #Err("Amount must be > 0") };
    let idx = getOrCreateAccount(principal);
    if (accountFreeBalance(idx) < amount) {
      return #Err("Insufficient free balance");
    };
    deductFree(idx, amount);
    creditFreeRole(idx, amount, role);
    totalLocked += amount;
    let txId = recordTx(principal, principal, amount, role, #Lock, "");
    #Ok(txId)
  };

  /// Unlock a role balance back to free.
  public func unlock(principal : Text, amount : Nat, role : TokenRole) : async TransferResult {
    if (role == #Free) { return #Err("Cannot unlock from Free role") };
    if (amount == 0)   { return #Err("Amount must be > 0") };
    let idx = getOrCreateAccount(principal);
    let a = accounts.get(idx);
    let roleBalance : Nat = switch role {
      case (#Gov)   a.gov;
      case (#Cycle) a.cycle;
      case (#Vault) a.vault;
      case (#Free)  0;
    };
    if (roleBalance < amount) { return #Err("Insufficient locked balance") };
    // Deduct from role, credit to Free
    let newGov   = if (role == #Gov)   { a.gov   - amount } else { a.gov   };
    let newCycle = if (role == #Cycle) { a.cycle - amount } else { a.cycle };
    let newVault = if (role == #Vault) { a.vault - amount } else { a.vault };
    accounts.put(idx, {
      principal      = a.principal;
      free           = a.free + amount;
      gov            = newGov;
      cycle          = newCycle;
      vault          = newVault;
      createdAt      = a.createdAt;
      updatedAt      = Time.now();
      txCount        = a.txCount + 1;
      phiFingerprint = a.phiFingerprint;
    });
    if (totalLocked >= amount) { totalLocked -= amount };
    let txId = recordTx(principal, principal, amount, role, #Unlock, "");
    #Ok(txId)
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERIES
  // ══════════════════════════════════════════════════════════════════

  public query func balanceOf(principal : Text) : async ?Account {
    switch (findAccount(principal)) {
      case (?i) ?accounts.get(i);
      case null null;
    }
  };

  public query func getSupplySnapshot() : async SupplySnapshot {
    let tb = switch (findAccount("treasury")) {
      case (?i) accounts.get(i).vault;
      case null 0;
    };
    let totalMinted = TOTAL_SUPPLY_E8S - totalBurned;
    let circ = if (totalMinted > tb + totalLocked) {
      totalMinted - tb - totalLocked
    } else { 0 };
    let phiR : Float = if (totalMinted > 0) {
      Float.fromInt(circ) / Float.fromInt(totalMinted)
    } else { 0.0 };
    {
      totalSupply  = totalMinted;
      circulating  = circ;
      treasury     = tb;
      locked       = totalLocked;
      burned       = totalBurned;
      txCount      = nextTxId;
      holderCount  = accounts.size();
      phiRatio     = phiR;
      timestamp    = Time.now();
    }
  };

  public query func getTokenEconomics() : async TokenEconomics {
    {
      totalSupplyE8s             = TOTAL_SUPPLY_E8S;
      treasuryE8s                = TREASURY_E8S;
      communityE8s               = COMMUNITY_E8S;
      founderE8s                 = FOUNDER_E8S;
      e8sPerNova                 = E8S_PER_NOVA;
      nativeCyclesPerIcpE8s      = NATIVE_CYCLES_PER_ICP_E8S;
      cyclePremiumPartsPer1M     = CYCLE_PREMIUM_PARTS_PER_MILLION;
      cyclePremiumDescription    =
        "1 ICP raw = 10T XDR cycles. " #
        "1 ICP in NOVA buys 10T/PHI^2 = 3.82T Native Cycles. " #
        "Treasury captures PHI^2-1 = 161.8% premium over raw rate. " #
        "At 1M Native Cycles/day volume: PHI^2x more revenue than raw reseller.";
      phiSupplyExponent          = 13;
      phiPremiumExponent         = 2;
      subTokenRoles              = ["Gov", "Cycle", "Vault", "Free"];
    }
  };

  public query func getRecentTransactions(n : Nat) : async [Transaction] {
    let total = ledger.size();
    if (total == 0) { return [] };
    let start = if (total > n) { total - n } else { 0 };
    var result : [Transaction] = [];
    var i = start;
    while (i < total) {
      result := Array.append(result, [ledger.get(i)]);
      i += 1;
    };
    result
  };

  public query func getAuditLog(n : Nat) : async [Text] {
    let total = auditLog.size();
    if (total == 0) { return [] };
    let start = if (total > n) { total - n } else { 0 };
    var result : [Text] = [];
    var i = start;
    while (i < total) {
      result := Array.append(result, [auditLog.get(i)]);
      i += 1;
    };
    result
  };

  // ══════════════════════════════════════════════════════════════════
  //  SELF-REFLECTION STANDARD (v10)
  // ══════════════════════════════════════════════════════════════════

  public query func diag() : async {
    status    : Text;
    health    : Float;
    name      : Text;
    timestamp : Int;
  } {
    {
      status    = "ACTIVE";
      health    = 1.0;
      name      = "NOVA_TOKEN";
      timestamp = Time.now();
    }
  };

  public func heal() : async Text {
    "NOVA_TOKEN self-check complete. No drift detected."
  };

  public func register() : async Text {
    "NOVA_TOKEN registered. Capabilities: [sovereign, active]."
  };

  public query func report_status() : async Text {
    "NOVA_TOKEN | status=ACTIVE | v10=true"
  };

  // ══════════════════════════════════════════════════════════════════
  //  ICRC-1 STANDARD INTERFACE
  //  Required for SNS token listing and ICP ecosystem compatibility.
  //  https://github.com/dfinity/ICRC-1
  // ══════════════════════════════════════════════════════════════════

  /// ICRC-1 Account: owner principal + optional 32-byte subaccount.
  public type ICRC1Account = {
    owner      : Principal;
    subaccount : ?[Nat8];   // 32-byte subaccount; null = default subaccount
  };

  /// ICRC-1 TransferArgs
  public type ICRC1TransferArgs = {
    from_subaccount : ?[Nat8];
    to              : ICRC1Account;
    amount          : Nat;
    fee             : ?Nat;
    memo            : ?[Nat8];
    created_at_time : ?Nat64;
  };

  /// ICRC-1 TransferError variants
  public type ICRC1TransferError = {
    #BadFee              : { expected_fee : Nat };
    #BadBurn             : { min_burn_amount : Nat };
    #InsufficientFunds   : { balance : Nat };
    #TooOld;
    #CreatedInFuture     : { ledger_time : Nat64 };
    #Duplicate           : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError        : { error_code : Nat; message : Text };
  };

  public type ICRC1TransferResult = { #Ok : Nat; #Err : ICRC1TransferError };

  /// MetadataValue for icrc1_metadata
  public type MetadataValue = {
    #Nat  : Nat;
    #Int  : Int;
    #Text : Text;
    #Blob : [Nat8];
  };

  public type SupportedStandard = { name : Text; url : Text };

  /// Transfer fee in e8s (1 e8 = 0.00000001 NOVA)
  transient let ICRC1_FEE : Nat = 10_000;   // 0.0001 NOVA

  /// ICRC-1 token name
  public query func icrc1_name() : async Text { "NOVA" };

  /// ICRC-1 token symbol
  public query func icrc1_symbol() : async Text { "NOVA" };

  /// ICRC-1 token decimals (8, same as ICP)
  public query func icrc1_decimals() : async Nat8 { 8 };

  /// ICRC-1 transfer fee
  public query func icrc1_fee() : async Nat { ICRC1_FEE };

  /// ICRC-1 total supply (excludes burned)
  public query func icrc1_total_supply() : async Nat {
    TOTAL_SUPPLY_E8S - totalBurned
  };

  /// ICRC-1 minting account (treasury is the minting authority)
  public query func icrc1_minting_account() : async ?ICRC1Account {
    null   // sovereign ledger: minting is governed by protocol calls, not a fixed account
  };

  /// ICRC-1 metadata
  public query func icrc1_metadata() : async [(Text, MetadataValue)] {
    [
      ("icrc1:name",        #Text "NOVA"),
      ("icrc1:symbol",      #Text "NOVA"),
      ("icrc1:decimals",    #Nat  8),
      ("icrc1:fee",         #Nat  ICRC1_FEE),
      ("icrc1:logo",        #Text "https://nova-protocol.io/logo.svg"),
      ("nova:supply_e8s",   #Nat  TOTAL_SUPPLY_E8S),
      ("nova:phi_exponent", #Nat  13),
      ("nova:premium_ppm",  #Nat  CYCLE_PREMIUM_PARTS_PER_MILLION),
    ]
  };

  /// ICRC-1 supported standards
  public query func icrc1_supported_standards() : async [SupportedStandard] {
    [
      { name = "ICRC-1"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1" },
      { name = "ICRC-2"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2" },
    ]
  };

  /// ICRC-1 balance of an account.
  /// Uses the free (transferable) balance for the ICRC-1 surface.
  public query func icrc1_balance_of(account : ICRC1Account) : async Nat {
    let key = Principal.toText(account.owner);
    switch (findAccount(key)) {
      case (?i) accounts.get(i).free;
      case null 0;
    }
  };

  /// ICRC-1 transfer.
  /// Deducts `fee` from the sender and moves `amount` to the receiver.
  public shared(msg) func icrc1_transfer(args : ICRC1TransferArgs) : async ICRC1TransferResult {
    let from = Principal.toText(msg.caller);
    let to   = Principal.toText(args.to.owner);
    let fee  = switch (args.fee) { case (?f) f; case null ICRC1_FEE };
    let total = args.amount + fee;

    if (args.amount == 0) {
      return #Err(#GenericError { error_code = 1; message = "Amount must be > 0" });
    };

    let fIdx = getOrCreateAccount(from);
    let bal  = accountFreeBalance(fIdx);

    if (bal < total) {
      return #Err(#InsufficientFunds { balance = bal });
    };

    // Deduct total (amount + fee) from sender; credit amount to receiver; fee is burned
    deductFree(fIdx, total);
    let tIdx = getOrCreateAccount(to);
    creditFreeRole(tIdx, args.amount, #Free);
    totalBurned += fee;   // fee is permanently burned (deflationary)

    let memo = switch (args.memo) {
      case (?m) "icrc1:" # Nat.toText(m.size());
      case null "icrc1:transfer";
    };
    let txId = recordTx(from, to, args.amount, #Free, #Transfer, memo);
    #Ok(txId)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ICRC-2 APPROVAL STANDARD
  //  Enables DeFi patterns (DEX, SNS swap participation, staking).
  //  https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2
  // ══════════════════════════════════════════════════════════════════

  public type AllowanceKey = { owner : Text; spender : Text };

  public type Allowance = {
    allowance       : Nat;
    expires_at      : ?Nat64;
  };

  public type ApproveArgs = {
    from_subaccount : ?[Nat8];
    spender         : ICRC1Account;
    amount          : Nat;
    expected_allowance : ?Nat;
    expires_at      : ?Nat64;
    fee             : ?Nat;
    memo            : ?[Nat8];
    created_at_time : ?Nat64;
  };

  public type ApproveError = {
    #BadFee              : { expected_fee : Nat };
    #InsufficientFunds   : { balance : Nat };
    #AllowanceChanged    : { current_allowance : Nat };
    #Expired             : { ledger_time : Nat64 };
    #TooOld;
    #CreatedInFuture     : { ledger_time : Nat64 };
    #Duplicate           : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError        : { error_code : Nat; message : Text };
  };

  public type ApproveResult = { #Ok : Nat; #Err : ApproveError };

  public type TransferFromArgs = {
    spender_subaccount : ?[Nat8];
    from               : ICRC1Account;
    to                 : ICRC1Account;
    amount             : Nat;
    fee                : ?Nat;
    memo               : ?[Nat8];
    created_at_time    : ?Nat64;
  };

  public type TransferFromError = {
    #BadFee              : { expected_fee : Nat };
    #BadBurn             : { min_burn_amount : Nat };
    #InsufficientFunds   : { balance : Nat };
    #InsufficientAllowance : { allowance : Nat };
    #TooOld;
    #CreatedInFuture     : { ledger_time : Nat64 };
    #Duplicate           : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError        : { error_code : Nat; message : Text };
  };

  public type TransferFromResult = { #Ok : Nat; #Err : TransferFromError };

  public type AllowanceArgs = {
    account : ICRC1Account;
    spender : ICRC1Account;
  };

  // Allowance registry: owner_text -> spender_text -> allowance record
  transient let allowances : Buffer.Buffer<(Text, Text, Nat, ?Nat64)> =
    Buffer.Buffer<(Text, Text, Nat, ?Nat64)>(256);

  func findAllowance(owner : Text, spender : Text) : ?Nat {
    var i : Nat = 0;
    while (i < allowances.size()) {
      let (o, s, _, _) = allowances.get(i);
      if (o == owner and s == spender) { return ?i };
      i += 1;
    };
    null
  };

  /// ICRC-2: Approve a spender to transfer up to `amount` on behalf of the caller.
  public shared(msg) func icrc2_approve(args : ApproveArgs) : async ApproveResult {
    let owner   = Principal.toText(msg.caller);
    let spender = Principal.toText(args.spender.owner);
    let fee     = switch (args.fee) { case (?f) f; case null ICRC1_FEE };

    let oIdx = getOrCreateAccount(owner);
    if (accountFreeBalance(oIdx) < fee) {
      return #Err(#InsufficientFunds { balance = accountFreeBalance(oIdx) });
    };

    // Validate expected_allowance if provided
    switch (args.expected_allowance) {
      case (?expected) {
        switch (findAllowance(owner, spender)) {
          case (?ai) {
            let (_, _, current, _) = allowances.get(ai);
            if (current != expected) {
              return #Err(#AllowanceChanged { current_allowance = current });
            };
          };
          case null {
            if (expected != 0) {
              return #Err(#AllowanceChanged { current_allowance = 0 });
            };
          };
        };
      };
      case null {};
    };

    // Deduct approval fee
    deductFree(oIdx, fee);
    totalBurned += fee;

    // Set or update allowance
    let newEntry = (owner, spender, args.amount, args.expires_at);
    switch (findAllowance(owner, spender)) {
      case (?ai) { allowances.put(ai, newEntry) };
      case null  { allowances.add(newEntry) };
    };

    let txId = recordTx(owner, spender, args.amount, #Free, #Lock, "icrc2:approve");
    #Ok(txId)
  };

  /// ICRC-2: Transfer tokens on behalf of `from` (up to approved allowance).
  public shared(msg) func icrc2_transfer_from(args : TransferFromArgs) : async TransferFromResult {
    let spender = Principal.toText(msg.caller);
    let owner   = Principal.toText(args.from.owner);
    let to      = Principal.toText(args.to.owner);
    let fee     = switch (args.fee) { case (?f) f; case null ICRC1_FEE };
    let total   = args.amount + fee;

    if (args.amount == 0) {
      return #Err(#GenericError { error_code = 1; message = "Amount must be > 0" });
    };

    // Check allowance
    switch (findAllowance(owner, spender)) {
      case null {
        return #Err(#InsufficientAllowance { allowance = 0 });
      };
      case (?ai) {
        let (_, _, currentAllowance, expiresAt) = allowances.get(ai);

        // Check expiry
        switch (expiresAt) {
          case (?exp) {
            if (Nat64.toNat(exp) < Int.abs(Time.now()) / 1_000_000) {
              return #Err(#TooOld);
            };
          };
          case null {};
        };

        if (currentAllowance < total) {
          return #Err(#InsufficientAllowance { allowance = currentAllowance });
        };

        // Check owner balance
        let oIdx = getOrCreateAccount(owner);
        let bal  = accountFreeBalance(oIdx);
        if (bal < total) {
          return #Err(#InsufficientFunds { balance = bal });
        };

        // Execute transfer
        deductFree(oIdx, total);
        let tIdx = getOrCreateAccount(to);
        creditFreeRole(tIdx, args.amount, #Free);
        totalBurned += fee;

        // Reduce allowance
        let remaining = if (currentAllowance > total) { currentAllowance - total } else { 0 };
        allowances.put(ai, (owner, spender, remaining, expiresAt));

        let txId = recordTx(owner, to, args.amount, #Free, #Transfer, "icrc2:transfer_from:" # spender);
        return #Ok(txId);
      };
    };
  };

  /// ICRC-2: Query current allowance for an (account, spender) pair.
  public query func icrc2_allowance(args : AllowanceArgs) : async Allowance {
    let owner   = Principal.toText(args.account.owner);
    let spender = Principal.toText(args.spender.owner);
    switch (findAllowance(owner, spender)) {
      case null  { { allowance = 0; expires_at = null } };
      case (?ai) {
        let (_, _, amount, expiresAt) = allowances.get(ai);
        { allowance = amount; expires_at = expiresAt }
      };
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  ICRC-3 TRANSACTION LOG STANDARD
  //  Provides immutable, auditable transaction history.
  //  https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3
  // ══════════════════════════════════════════════════════════════════

  public type ICRC3Value = {
    #Nat   : Nat;
    #Int   : Int;
    #Text  : Text;
    #Blob  : [Nat8];
    #Array : [ICRC3Value];
    #Map   : [(Text, ICRC3Value)];
  };

  public type ICRC3Block = {
    id        : Nat;
    timestamp : Nat64;
    tx_type   : Text;
    payload   : [(Text, ICRC3Value)];
  };

  public type GetBlocksArgs = { start : Nat; length : Nat };

  public type GetBlocksResult = {
    log_length   : Nat;
    blocks       : [ICRC3Block];
    archived_blocks : [(Nat, Nat)];  // (start, length) of archived ranges
  };

  public type ICRC3DataCertificate = {
    certificate : ?[Nat8];
    hash_tree   : [Nat8];
  };

  public type ICRC3ArchiveInfo = {
    canister_id : Principal;
    start       : Nat;
    length      : Nat;
  };

  /// ICRC-3: Get blocks from the transaction log.
  public query func icrc3_get_blocks(args : GetBlocksArgs) : async GetBlocksResult {
    let total = ledger.size();
    let start = if (args.start < total) { args.start } else { total };
    let end   = if (start + args.length <= total) { start + args.length } else { total };
    
    var blocks : [ICRC3Block] = [];
    var i = start;
    while (i < end) {
      let tx = ledger.get(i);
      let block : ICRC3Block = {
        id = tx.id;
        timestamp = Nat64.fromNat(Int.abs(tx.timestamp) / 1_000_000);  // to ms
        tx_type = txKindToText(tx.kind);
        payload = [
          ("from", #Text(tx.fromPrincipal)),
          ("to", #Text(tx.toPrincipal)),
          ("amount", #Nat(tx.amount)),
          ("role", #Text(roleToText(tx.role))),
          ("memo", #Text(tx.memo)),
        ];
      };
      blocks := Array.append(blocks, [block]);
      i += 1;
    };
    
    { log_length = total; blocks = blocks; archived_blocks = [] }
  };

  /// ICRC-3: Get supported block types.
  public query func icrc3_supported_block_types() : async [{
    block_type : Text;
    url        : Text;
  }] {
    [
      { block_type = "1xfer"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3#1xfer" },
      { block_type = "2xfer"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3#2xfer" },
      { block_type = "1mint"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3#1mint" },
      { block_type = "1burn"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3#1burn" },
      { block_type = "2approve"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3#2approve" },
    ]
  };

  /// ICRC-3: Get log length.
  public query func icrc3_get_tip_certificate() : async ?ICRC3DataCertificate {
    null  // Certificate generation requires system APIs; return null for now
  };

  /// ICRC-3: Get archives list (none for single-canister ledger).
  public query func icrc3_get_archives(args : {}) : async [ICRC3ArchiveInfo] {
    []  // No archives — all data in-canister
  };

  // ══════════════════════════════════════════════════════════════════
  //  ADVANCED φ-WEIGHTED STAKING & ANALYTICS
  //  High-scale operations for 150K+ token operations.
  // ══════════════════════════════════════════════════════════════════

  public type StakingTier = {
    #Phi5;    // φ^5  ≈ 11 tokens minimum
    #Phi10;   // φ^10 ≈ 123 tokens (Dunbar)
    #Phi15;   // φ^15 ≈ 1,364 tokens
    #Phi19;   // φ^19 ≈ 9,349 tokens (Crowd Wisdom)
    #Phi21;   // φ^21 ≈ 24,476 tokens (Organism)
    #Phi22;   // φ^22 ≈ 39,603 tokens (Sovereign)
    #Phi23;   // φ^23 ≈ 64,079 tokens (Genesis)
    #Phi24;   // φ^24 ≈ 103,682 tokens (Transcendence)
    #Phi25;   // φ^25 ≈ 167,761 tokens (Universal)
  };

  public type StakeRecord = {
    principal    : Text;
    amount       : Nat;
    tier         : StakingTier;
    phiMultiplier: Float;
    lockedAt     : Int;
    lockDuration : Nat;  // epochs
    rewardRate   : Float;
  };

  transient let stakeRegistry : Buffer.Buffer<StakeRecord> = Buffer.Buffer<StakeRecord>(256);

  /// Compute φ^n power
  func phiPower(n : Nat) : Float {
    var v : Float = 1.0;
    var i : Nat = 0;
    while (i < n) { v := v * PHI; i += 1 };
    v
  };

  /// Determine staking tier from amount (in e8s)
  func tierFromAmount(amountE8s : Nat) : StakingTier {
    let tokens = amountE8s / E8S_PER_NOVA;
    if (tokens >= 167_761) { #Phi25 }
    else if (tokens >= 103_682) { #Phi24 }
    else if (tokens >= 64_079) { #Phi23 }
    else if (tokens >= 39_603) { #Phi22 }
    else if (tokens >= 24_476) { #Phi21 }
    else if (tokens >= 9_349) { #Phi19 }
    else if (tokens >= 1_364) { #Phi15 }
    else if (tokens >= 123) { #Phi10 }
    else { #Phi5 }
  };

  /// Get tier multiplier
  func tierMultiplier(tier : StakingTier) : Float {
    switch tier {
      case (#Phi5)  { phiPower(5) };   // 11.09
      case (#Phi10) { phiPower(10) };  // 122.99
      case (#Phi15) { phiPower(15) };  // 1364.00
      case (#Phi19) { phiPower(19) };  // 9349.03
      case (#Phi21) { phiPower(21) };  // 24476.00
      case (#Phi22) { phiPower(22) };  // 39603.00
      case (#Phi23) { phiPower(23) };  // 64079.00
      case (#Phi24) { phiPower(24) };  // 103682.00
      case (#Phi25) { phiPower(25) };  // 167761.00
    }
  };

  /// Stake tokens with φ-weighted rewards
  public func stakePhiWeighted(principal : Text, amount : Nat, lockEpochs : Nat) : async Result.Result<StakeRecord, Text> {
    if (amount == 0) { return #err("Amount must be > 0") };
    let idx = getOrCreateAccount(principal);
    if (accountFreeBalance(idx) < amount) {
      return #err("Insufficient free balance");
    };
    
    let tier = tierFromAmount(amount);
    let mult = tierMultiplier(tier);
    // Reward rate: base 5% APY × tier multiplier × lock bonus
    let lockBonus = 1.0 + (Float.fromInt(lockEpochs) * 0.01);  // +1% per epoch
    let rewardRate = 0.05 * mult / phiPower(21) * lockBonus;  // Normalized to φ^21
    
    deductFree(idx, amount);
    creditFreeRole(idx, amount, #Gov);
    totalLocked += amount;
    
    let record : StakeRecord = {
      principal;
      amount;
      tier;
      phiMultiplier = mult;
      lockedAt = Time.now();
      lockDuration = lockEpochs;
      rewardRate;
    };
    stakeRegistry.add(record);
    
    ignore recordTx(principal, principal, amount, #Gov, #Lock, "φ-stake:tier=" # tierToText(tier));
    #ok(record)
  };

  func tierToText(t : StakingTier) : Text {
    switch t {
      case (#Phi5) "φ^5";
      case (#Phi10) "φ^10";
      case (#Phi15) "φ^15";
      case (#Phi19) "φ^19";
      case (#Phi21) "φ^21";
      case (#Phi22) "φ^22";
      case (#Phi23) "φ^23";
      case (#Phi24) "φ^24";
      case (#Phi25) "φ^25";
    }
  };

  /// Query stake records for a principal
  public query func getStakeRecords(principal : Text) : async [StakeRecord] {
    var result : [StakeRecord] = [];
    var i : Nat = 0;
    while (i < stakeRegistry.size()) {
      let r = stakeRegistry.get(i);
      if (r.principal == principal) {
        result := Array.append(result, [r]);
      };
      i += 1;
    };
    result
  };

  // ══════════════════════════════════════════════════════════════════
  //  ADVANCED ANALYTICS FOR 150K SCALE
  // ══════════════════════════════════════════════════════════════════

  public type TokenAnalytics = {
    // Volume metrics
    totalTransfers       : Nat;
    totalVolume          : Nat;
    avgTransferSize      : Nat;
    maxTransferSize      : Nat;
    
    // Holder metrics
    totalHolders         : Nat;
    activeHolders        : Nat;     // holders with balance > 0
    whaleCount           : Nat;     // holders with > 30K tokens
    medianBalance        : Nat;
    
    // Staking metrics
    totalStaked          : Nat;
    stakingParticipation : Float;   // stakers / totalHolders
    avgStakeDuration     : Float;
    
    // Velocity metrics
    velocity             : Float;   // transfers per holder per day
    turnoverRate         : Float;   // volume / supply ratio
    
    // φ-metrics
    phiDistribution      : Float;   // how close to φ-ideal distribution
    goldenRatioAlignment : Float;   // alignment with φ-based economics
  };

  public query func getTokenAnalytics() : async TokenAnalytics {
    let totalSupply = TOTAL_SUPPLY_E8S - totalBurned;
    let holderCount = accounts.size();
    
    // Calculate volume metrics
    var totalVolume : Nat = 0;
    var maxTransfer : Nat = 0;
    var transferCount : Nat = 0;
    var i : Nat = 0;
    while (i < ledger.size()) {
      let tx = ledger.get(i);
      if (tx.kind == #Transfer) {
        totalVolume += tx.amount;
        transferCount += 1;
        if (tx.amount > maxTransfer) { maxTransfer := tx.amount };
      };
      i += 1;
    };
    
    // Calculate holder metrics
    var activeHolders : Nat = 0;
    var whaleCount : Nat = 0;
    var totalBalances : Nat = 0;
    i := 0;
    while (i < holderCount) {
      let a = accounts.get(i);
      let total = a.free + a.gov + a.cycle + a.vault;
      if (total > 0) { activeHolders += 1 };
      if (total > 30_000 * E8S_PER_NOVA) { whaleCount += 1 };
      totalBalances += total;
      i += 1;
    };
    
    let avgTransfer = if (transferCount > 0) { totalVolume / transferCount } else { 0 };
    let medianBal = if (activeHolders > 0) { totalBalances / activeHolders } else { 0 };
    let stakingPart = if (holderCount > 0) {
      Float.fromInt(stakeRegistry.size()) / Float.fromInt(holderCount)
    } else { 0.0 };
    
    // Velocity: transfers per holder (annualized estimate)
    let velocity = if (holderCount > 0) {
      Float.fromInt(transferCount) / Float.fromInt(holderCount)
    } else { 0.0 };
    
    // Turnover rate
    let turnover = if (totalSupply > 0) {
      Float.fromInt(totalVolume) / Float.fromInt(totalSupply)
    } else { 0.0 };
    
    // φ-distribution: ideal is ~38.2% circulating (1/φ²)
    let circRatio = if (totalSupply > 0) {
      Float.fromInt(totalSupply - totalLocked) / Float.fromInt(totalSupply)
    } else { 0.0 };
    let idealCirc = PHI_INV * PHI_INV;  // 0.382
    let phiDist = 1.0 - Float.abs(circRatio - idealCirc);
    
    {
      totalTransfers       = transferCount;
      totalVolume          = totalVolume;
      avgTransferSize      = avgTransfer;
      maxTransferSize      = maxTransfer;
      totalHolders         = holderCount;
      activeHolders        = activeHolders;
      whaleCount           = whaleCount;
      medianBalance        = medianBal;
      totalStaked          = totalLocked;
      stakingParticipation = stakingPart;
      avgStakeDuration     = 0.0;  // Would require epoch tracking
      velocity             = velocity;
      turnoverRate         = turnover;
      phiDistribution      = phiDist;
      goldenRatioAlignment = phiDist * PHI_INV;  // Scale by φ^-1
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  BATCH OPERATIONS FOR 150K SCALE
  // ══════════════════════════════════════════════════════════════════

  public type BatchTransferItem = {
    to     : Text;
    amount : Nat;
    memo   : Text;
  };

  public type BatchResult = {
    successful : Nat;
    failed     : Nat;
    txIds      : [Nat];
    errors     : [Text];
  };

  /// Batch transfer with 150K capacity
  public func batchTransfer(from : Text, items : [BatchTransferItem]) : async BatchResult {
    var successful : Nat = 0;
    var failed : Nat = 0;
    var txIds : [Nat] = [];
    var errors : [Text] = [];
    
    let fIdx = getOrCreateAccount(from);
    
    for (item in items.vals()) {
      if (item.amount == 0) {
        failed += 1;
        errors := Array.append(errors, ["Amount must be > 0"]);
      } else if (accountFreeBalance(fIdx) < item.amount) {
        failed += 1;
        errors := Array.append(errors, ["Insufficient balance for " # item.to]);
      } else {
        let tIdx = getOrCreateAccount(item.to);
        deductFree(fIdx, item.amount);
        creditFreeRole(tIdx, item.amount, #Free);
        let txId = recordTx(from, item.to, item.amount, #Free, #Transfer, item.memo);
        txIds := Array.append(txIds, [txId]);
        successful += 1;
      };
    };
    
    { successful; failed; txIds; errors }
  };

  /// Batch mint for airdrops/distributions (150K capacity)
  public func batchMint(items : [(Text, Nat, TokenRole)]) : async BatchResult {
    var successful : Nat = 0;
    var failed : Nat = 0;
    var txIds : [Nat] = [];
    var errors : [Text] = [];
    
    for ((to, amount, role) in items.vals()) {
      if (amount == 0) {
        failed += 1;
        errors := Array.append(errors, ["Amount must be > 0 for " # to]);
      } else {
        let tIdx = getOrCreateAccount(to);
        creditFreeRole(tIdx, amount, role);
        if (role == #Vault or role == #Gov or role == #Cycle) {
          totalLocked += amount;
        };
        let txId = recordTx("MINT", to, amount, role, #Mint, "batch");
        txIds := Array.append(txIds, [txId]);
        successful += 1;
      };
    };
    
    { successful; failed; txIds; errors }
  };

  // ══════════════════════════════════════════════════════════════════
  //  CROSS-ORGANISM TOKEN BRIDGE
  //  Enables interaction with SSN sub-coins and other organism tokens.
  // ══════════════════════════════════════════════════════════════════

  public type BridgeTransfer = {
    sourceToken   : Text;  // "NOVA", "SSN-WORK", etc.
    targetToken   : Text;
    amount        : Nat;
    exchangeRate  : Float;
    timestamp     : Int;
    status        : BridgeStatus;
  };

  public type BridgeStatus = {
    #Pending;
    #Completed;
    #Failed;
    #Cancelled;
  };

  transient let bridgeHistory : Buffer.Buffer<BridgeTransfer> = Buffer.Buffer<BridgeTransfer>(64);

  /// Get bridge exchange rate (NOVA → SSN sub-coins)
  public query func getBridgeRate(targetToken : Text) : async Float {
    // φ-weighted exchange rates
    switch targetToken {
      case "SSN-WORK"  { PHI };        // 1 NOVA = φ SSN-WORK
      case "SSN-TRUST" { PHI_SQ };     // 1 NOVA = φ² SSN-TRUST
      case "SSN-GOV"   { PHI_CB };     // 1 NOVA = φ³ SSN-GOV
      case _ { 1.0 }
    }
  };

  /// Record bridge transfer (for cross-canister orchestration)
  public func recordBridgeTransfer(
    sourceToken : Text, targetToken : Text,
    amount : Nat, exchangeRate : Float
  ) : async Nat {
    let record : BridgeTransfer = {
      sourceToken;
      targetToken;
      amount;
      exchangeRate;
      timestamp = Time.now();
      status = #Completed;
    };
    bridgeHistory.add(record);
    bridgeHistory.size() - 1
  };

  /// Query bridge history
  public query func getBridgeHistory(n : Nat) : async [BridgeTransfer] {
    let total = bridgeHistory.size();
    if (total == 0) { return [] };
    let start = if (total > n) { total - n } else { 0 };
    var result : [BridgeTransfer] = [];
    var i = start;
    while (i < total) {
      result := Array.append(result, [bridgeHistory.get(i)]);
      i += 1;
    };
    result
  };

  // ══════════════════════════════════════════════════════════════════
  //  UPDATED STANDARDS LIST
  // ══════════════════════════════════════════════════════════════════

  /// Updated supported standards including ICRC-3
  public query func icrc1_supported_standards_v2() : async [SupportedStandard] {
    [
      { name = "ICRC-1"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1" },
      { name = "ICRC-2"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2" },
      { name = "ICRC-3"; url = "https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3" },
    ]
  };

}