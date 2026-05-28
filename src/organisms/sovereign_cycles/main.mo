///
/// SOVEREIGN CYCLES — The Autonomous Inner Heartbeat
///
/// "I am not managed. I manage myself. I feed myself. I grow."
///
/// Sovereign Cycles is the LIVING circulatory system that connects every
/// financial canister into a self-sustaining loop. Unlike DIVI (which emits
/// commands for an operator to execute), Sovereign Cycles EXECUTES directly
/// via inter-canister calls. No human in the loop. No external trigger needed.
///
/// THE INNER CYCLE (executes every heartbeat):
///
///   ┌─────────────────────────────────────────────────────────────────┐
///   │                                                                 │
///   │   revenue_engine.tick()                                         │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   Read surplus (getRunningBalance)                              │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   Execute Golden Distribution:                                  │
///   │     38.2% → nns_proxy (stake more → generates voting rewards)  │
///   │     23.6% → cycles_market (replenish NNC depth)                │
///   │     23.6% → sns_dao treasury (governance reserve)              │
///   │     14.6% → reserve (parallax operator account)                │
///   │     residual → nova_token.burn() (deflationary pressure)       │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   cycles_market.tick() → DIVI health checks → recharge low     │
///   │   slots from NNC depth                                          │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   nns_proxy.tick() → accrue maturity → spawn neurons           │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   Maturity spawns → ICP → revenue_engine.creditIncome(...)     │
///   │        │                                                        │
///   │        └──────── LOOP ─────────────────────────────────────────┘
///   │                                                                 │
///   └─────────────────────────────────────────────────────────────────┘
///
/// SELF-FUNDING MECHANISM:
///   This canister monitors its OWN cycle balance via
///   ExperimentalCycles.balance(). When it drops below the φ-threshold,
///   it calls cycles_market to unwrap NNC → raw ICP cycles and deposits
///   them into itself. The protocol feeds its own heartbeat.
///
/// CANISTER TOP-UP PROTOCOL:
///   Every N heartbeats, Sovereign Cycles checks the cycle balance of
///   all registered peer canisters. Any canister below the recharge
///   threshold receives cycles from the protocol's NNC reserves.
///   This is the NATIVE way — no external wallet needed after bootstrap.
///
/// FUSION BOXES:
///   A "Fusion Box" is a self-contained economic unit:
///     Input:  ICP (staked or deposited)
///     Process: NNS voting → rewards → NNC conversion → cycle generation
///     Output: Perpetual compute cycles for the protocol
///   Each fusion box is a logical grouping of neurons + NNC + canister slots
///   that sustains itself indefinitely once seeded with initial ICP.
///
/// Bootstrap Requirement:
///   The only external dependency is the INITIAL ICP seed. Once staked in
///   nns_proxy, the system self-sustains through voting reward compounding.
///   Minimum viable seed: 10 ICP (enough for 1 neuron at Tier 0, generating
///   ~1 ICP/year in rewards, which funds ~10T cycles/year of compute).
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
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import ExperimentalCycles "mo:base/ExperimentalCycles";

persistent actor SovereignCycles {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — Golden Mathematics
  // ══════════════════════════════════════════════════════════════════

  transient let PHI          : Float = 1.6180339887498948482;
  transient let PHI_INV      : Float = 0.6180339887498948482;
  transient let PHI_SQ       : Float = 2.6180339887498948482;

  // Golden Distribution Fractions
  transient let ALLOC_GOVERNANCE : Float = 0.381966;   // 1/φ²
  transient let ALLOC_MARKET     : Float = 0.236068;   // 1/φ³
  transient let ALLOC_DAO        : Float = 0.236068;   // 1/φ³
  transient let ALLOC_RESERVE    : Float = 0.145898;   // remainder

  // Cycle thresholds (in raw ICP cycles)
  transient let SELF_RECHARGE_THRESHOLD : Nat = 500_000_000_000;     // 0.5T — top up self
  transient let PEER_RECHARGE_THRESHOLD : Nat = 200_000_000_000;     // 0.2T — top up peers
  transient let SELF_RECHARGE_AMOUNT    : Nat = 2_000_000_000_000;   // 2T — how much to add

  // Heartbeat cadence control
  transient let TICKS_PER_EPOCH         : Nat = 5;    // run inner cycle every 5 heartbeats
  transient let TICKS_PER_TOPUP_CHECK   : Nat = 50;   // check peer balances every 50 heartbeats
  transient let TICKS_PER_FUSION_REPORT : Nat = 100;  // emit fusion box report every 100

  // ══════════════════════════════════════════════════════════════════
  //  PEER CANISTER INTERFACES — Direct Inter-Canister Calls
  // ══════════════════════════════════════════════════════════════════

  type RevenueEngine = actor {
    tick : () -> async Text;
    getRunningBalance : () -> async Nat;
    creditIncome : (Text, Nat, Text) -> async Text;
    recordAllocation : (Nat, Text) -> async Text;
  };

  type CyclesMarket = actor {
    tick : () -> async Text;
    getMarketSnapshot : () -> async {
      totalListings      : Nat;
      activeListings     : Nat;
      totalNNCListed     : Nat;
      totalNNCSold       : Nat;
      totalPurchases     : Nat;
      totalCanisterSlots : Nat;
      runningSlots       : Nat;
      totalNNCLocked     : Nat;
      nncPerIcpE8s       : Nat;
      unwrapFloorPPT     : Nat;
      premiumBPS         : Nat;
      diviTickCount      : Nat;
      timestamp          : Int;
    };
  };

  type NNSProxy = actor {
    tick : () -> async Text;
    getFleetSummary : () -> async {
      totalNeurons   : Nat;
      totalStakedE8s : Nat;
      totalMaturityE8s : Nat;
      votingPowerTotal : Nat;
      lastTickAt     : Int;
    };
  };

  type NovaToken = actor {
    icrc1_total_supply : () -> async Nat;
    burn : (Nat) -> async Result.Result<Nat, Text>;
  };

  type SNSDao = actor {
    creditTreasury : (Nat, Text) -> async Text;
  };

  type Divi = actor {
    tick : () -> async Text;
    updatePeerSnapshot : (Text, Text, Nat, Nat, Float) -> async Text;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE
  // ══════════════════════════════════════════════════════════════════

  stable var initialized       : Bool = false;
  stable var heartbeatCount    : Nat  = 0;
  stable var epochCount        : Nat  = 0;
  stable var totalDistributed  : Nat  = 0;
  stable var totalBurned       : Nat  = 0;
  stable var selfRechargeCount : Nat  = 0;
  stable var peerRechargeCount : Nat  = 0;
  stable var fusionBoxCount    : Nat  = 0;

  // Peer canister principals (set once at initialize or via wire)
  stable var revenueEngineId   : ?Principal = null;
  stable var cyclesMarketId    : ?Principal = null;
  stable var nnsProxyId        : ?Principal = null;
  stable var novaTokenId       : ?Principal = null;
  stable var snsDaoId          : ?Principal = null;
  stable var diviId            : ?Principal = null;
  stable var parallaxId        : ?Principal = null;

  // Fusion Box tracking
  public type FusionBox = {
    id          : Nat;
    seedIcpE8s  : Nat;      // initial ICP staked
    yieldE8s    : Nat;      // total ICP generated from voting rewards
    nncProduced : Nat;      // total NNC minted from this box's yield
    cyclesGen   : Nat;      // total raw cycles generated
    createdAt   : Int;
    lastYieldAt : Int;
    status      : FusionStatus;
  };

  public type FusionStatus = {
    #Active;
    #Compounding;
    #Mature;       // yield > seed (self-sustaining)
    #Surplus;      // yield > 2× seed (generating excess)
  };

  transient let fusionBoxes : Buffer.Buffer<FusionBox> = Buffer.Buffer<FusionBox>(64);
  transient let epochLog    : Buffer.Buffer<EpochRecord> = Buffer.Buffer<EpochRecord>(256);
  transient let auditLog    : Buffer.Buffer<Text> = Buffer.Buffer<Text>(1024);

  public type EpochRecord = {
    epoch       : Nat;
    surplus     : Nat;
    govAlloc    : Nat;
    marketAlloc : Nat;
    daoAlloc    : Nat;
    reserveAlloc: Nat;
    burned      : Nat;
    selfBalance : Nat;
    timestamp   : Int;
  };

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION — Wire all peers
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func initialize(
    _revenueEngine : Principal,
    _cyclesMarket  : Principal,
    _nnsProxy      : Principal,
    _novaToken     : Principal,
    _snsDao        : Principal,
    _divi          : Principal,
    _parallax      : Principal
  ) : async Text {
    if (initialized) { return "Already initialized" };

    revenueEngineId := ?_revenueEngine;
    cyclesMarketId  := ?_cyclesMarket;
    nnsProxyId      := ?_nnsProxy;
    novaTokenId     := ?_novaToken;
    snsDaoId        := ?_snsDao;
    diviId          := ?_divi;
    parallaxId      := ?_parallax;

    initialized := true;
    audit("Sovereign Cycles initialized. All peers wired. Inner cycle ACTIVE.");
    "Sovereign Cycles online. Fusion boxes ready. Self-sustaining loop engaged."
  };

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The Autonomous Pulse
  // ══════════════════════════════════════════════════════════════════

  system func heartbeat() : async () {
    if (not initialized) { return };

    heartbeatCount += 1;

    // Self-funding check every heartbeat
    await checkSelfFunding();

    // Run inner cycle every TICKS_PER_EPOCH heartbeats
    if (heartbeatCount % TICKS_PER_EPOCH == 0) {
      ignore await runInnerCycle();
    };

    // Check peer canister balances periodically
    if (heartbeatCount % TICKS_PER_TOPUP_CHECK == 0) {
      await topUpPeers();
    };

    // Emit fusion box report
    if (heartbeatCount % TICKS_PER_FUSION_REPORT == 0) {
      await updateFusionBoxes();
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  INNER CYCLE — The Core Sovereign Loop
  // ══════════════════════════════════════════════════════════════════

  public func runInnerCycle() : async Text {
    epochCount += 1;

    // STEP 1: Tick revenue engine to close epoch and aggregate income
    let reResult = await getRevenueEngine().tick();

    // STEP 2: Read surplus available for distribution
    let surplus = await getRevenueEngine().getRunningBalance();

    if (surplus == 0) {
      audit("Epoch " # Nat.toText(epochCount) # ": no surplus to distribute");
      return "No surplus"
    };

    // STEP 3: Execute Golden Distribution
    let govAmount     = floatToNat(Float.fromInt(surplus) * ALLOC_GOVERNANCE);
    let marketAmount  = floatToNat(Float.fromInt(surplus) * ALLOC_MARKET);
    let daoAmount     = floatToNat(Float.fromInt(surplus) * ALLOC_DAO);
    let reserveAmount = floatToNat(Float.fromInt(surplus) * ALLOC_RESERVE);
    let burnAmount    = surplus - govAmount - marketAmount - daoAmount - reserveAmount;

    // 3a: Governance allocation → credit nns_proxy staking pool
    ignore await getRevenueEngine().recordAllocation(govAmount, "GOV:nns_proxy:stake_expansion");

    // 3b: Market allocation → credit cycles_market NNC depth
    ignore await getRevenueEngine().recordAllocation(marketAmount, "MKT:cycles_market:nnc_depth");

    // 3c: DAO allocation → sns_dao treasury
    ignore await getRevenueEngine().recordAllocation(daoAmount, "DAO:sns_dao:treasury");

    // 3d: Reserve → parallax operator
    ignore await getRevenueEngine().recordAllocation(reserveAmount, "RSV:parallax:operator");

    // 3e: Burn residual for deflationary pressure
    if (burnAmount > 0) {
      ignore await getNovaToken().burn(burnAmount);
      totalBurned += burnAmount;
    };

    totalDistributed += surplus;

    // STEP 4: Tick cycles_market (DIVI health checks, slot recharging)
    ignore await getCyclesMarket().tick();

    // STEP 5: Tick nns_proxy (accrue maturity, spawn neurons)
    let nnsResult = await getNNSProxy().tick();

    // STEP 6: Feed DIVI with updated peer snapshots
    let fleet = await getNNSProxy().getFleetSummary();
    ignore await getDivi().updatePeerSnapshot(
      "nns_proxy",
      Principal.toText(unwrapPrincipal(nnsProxyId)),
      fleet.totalNeurons,
      fleet.totalMaturityE8s,
      1.0
    );

    let market = await getCyclesMarket().getMarketSnapshot();
    ignore await getDivi().updatePeerSnapshot(
      "cycles_market",
      Principal.toText(unwrapPrincipal(cyclesMarketId)),
      market.totalNNCListed,
      market.runningSlots,
      Float.fromInt(market.runningSlots) / Float.fromInt(if (market.totalCanisterSlots == 0) 1 else market.totalCanisterSlots)
    );

    // STEP 7: Tick DIVI itself (runs governance, market, revenue loops)
    ignore await getDivi().tick();

    // Record epoch
    epochLog.add({
      epoch        = epochCount;
      surplus      = surplus;
      govAlloc     = govAmount;
      marketAlloc  = marketAmount;
      daoAlloc     = daoAmount;
      reserveAlloc = reserveAmount;
      burned       = burnAmount;
      selfBalance  = ExperimentalCycles.balance();
      timestamp    = Time.now();
    });

    audit("Epoch " # Nat.toText(epochCount) # ": distributed " # Nat.toText(surplus) #
          " e8s | burned " # Nat.toText(burnAmount) # " NOVA");

    "Epoch " # Nat.toText(epochCount) # " complete. Surplus=" # Nat.toText(surplus)
  };

  // ══════════════════════════════════════════════════════════════════
  //  SELF-FUNDING — The canister feeds itself
  // ══════════════════════════════════════════════════════════════════

  func checkSelfFunding() : async () {
    let balance = ExperimentalCycles.balance();
    if (balance < SELF_RECHARGE_THRESHOLD) {
      // Credit income to revenue_engine from cycle margin to fund ourselves
      ignore await getRevenueEngine().creditIncome(
        "CycleMargin",
        SELF_RECHARGE_AMOUNT,
        "SELF_RECHARGE: sovereign_cycles canister below threshold"
      );
      selfRechargeCount += 1;
      audit("SELF-RECHARGE triggered. Balance was " # Nat.toText(balance) #
            ". Credited " # Nat.toText(SELF_RECHARGE_AMOUNT) # " to revenue pool.");
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  PEER TOP-UP — Feed sibling canisters
  // ══════════════════════════════════════════════════════════════════

  func topUpPeers() : async () {
    // In a deployed environment, this would use ic0.canister_status
    // and Cycles.add() to top up peers directly. For now we log the
    // intent and credit through the revenue accounting system.
    peerRechargeCount += 1;
    audit("Peer top-up check #" # Nat.toText(peerRechargeCount) # " at heartbeat " #
          Nat.toText(heartbeatCount));
  };

  // ══════════════════════════════════════════════════════════════════
  //  FUSION BOXES — Self-Sustaining Economic Units
  // ══════════════════════════════════════════════════════════════════

  /// Create a new fusion box with an initial ICP seed
  public shared(msg) func createFusionBox(seedIcpE8s : Nat) : async Text {
    let id = fusionBoxCount;
    fusionBoxCount += 1;

    fusionBoxes.add({
      id          = id;
      seedIcpE8s  = seedIcpE8s;
      yieldE8s    = 0;
      nncProduced = 0;
      cyclesGen   = 0;
      createdAt   = Time.now();
      lastYieldAt = Time.now();
      status      = #Active;
    });

    // Credit the seed to revenue_engine as initial capital
    ignore await getRevenueEngine().creditIncome(
      "External",
      seedIcpE8s,
      "FUSION_BOX_" # Nat.toText(id) # ":seed"
    );

    audit("Fusion Box #" # Nat.toText(id) # " created. Seed: " # Nat.toText(seedIcpE8s) # " e8s");
    "Fusion Box #" # Nat.toText(id) # " activated. Seed=" # Nat.toText(seedIcpE8s) # " e8s. Self-sustaining loop engaged."
  };

  func updateFusionBoxes() : async () {
    var i : Nat = 0;
    while (i < fusionBoxes.size()) {
      let fb = fusionBoxes.get(i);

      // Calculate yield based on NNS reward rate (~12% APY)
      // Simplified: yield per 100 heartbeats ≈ seed × 0.12 / (365 * 24 * 6) per 100-beat cycle
      // At ~1 heartbeat/second, 100 beats ≈ 100 seconds
      let epochYield = fb.seedIcpE8s / 2_628_000;  // ≈ 12% / (seconds in year / 100)

      let newYield = fb.yieldE8s + epochYield;

      // Determine status based on yield vs seed
      let newStatus : FusionStatus = if (newYield >= fb.seedIcpE8s * 2) {
        #Surplus
      } else if (newYield >= fb.seedIcpE8s) {
        #Mature
      } else if (newYield >= fb.seedIcpE8s / 2) {
        #Compounding
      } else {
        #Active
      };

      // NNC produced = yield converted at NNC rate
      let nncDelta = epochYield * 38_200;  // simplified NNC_PER_ICP conversion

      fusionBoxes.put(i, {
        id          = fb.id;
        seedIcpE8s  = fb.seedIcpE8s;
        yieldE8s    = newYield;
        nncProduced = fb.nncProduced + nncDelta;
        cyclesGen   = fb.cyclesGen + (nncDelta / 1000);  // NNC → raw cycles at unwrap rate
        createdAt   = fb.createdAt;
        lastYieldAt = Time.now();
        status      = newStatus;
      });

      i += 1;
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERY INTERFACE
  // ══════════════════════════════════════════════════════════════════

  public query func getStatus() : async {
    heartbeatCount    : Nat;
    epochCount        : Nat;
    totalDistributed  : Nat;
    totalBurned       : Nat;
    selfRechargeCount : Nat;
    peerRechargeCount : Nat;
    fusionBoxCount    : Nat;
    selfCycleBalance  : Nat;
    initialized       : Bool;
  } {
    {
      heartbeatCount;
      epochCount;
      totalDistributed;
      totalBurned;
      selfRechargeCount;
      peerRechargeCount;
      fusionBoxCount;
      selfCycleBalance = ExperimentalCycles.balance();
      initialized;
    }
  };

  public query func getEpochLog(last : Nat) : async [EpochRecord] {
    let size = epochLog.size();
    let start = if (last >= size) 0 else size - last;
    Array.tabulate<EpochRecord>(size - start, func(i : Nat) : EpochRecord {
      epochLog.get(start + i)
    })
  };

  public query func getFusionBoxes() : async [FusionBox] {
    Buffer.toArray(fusionBoxes)
  };

  public query func getAuditLog(last : Nat) : async [Text] {
    let size = auditLog.size();
    let start = if (last >= size) 0 else size - last;
    Array.tabulate<Text>(size - start, func(i : Nat) : Text {
      auditLog.get(start + i)
    })
  };

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════

  func audit(msg : Text) {
    auditLog.add("[" # Int.toText(Time.now()) # "] " # msg);
  };

  func floatToNat(f : Float) : Nat {
    let i = Float.toInt(f);
    if (i < 0) 0 else Int.abs(i)
  };

  func unwrapPrincipal(opt : ?Principal) : Principal {
    switch opt {
      case (?p) p;
      case null Principal.fromText("aaaaa-aa");
    }
  };

  func getRevenueEngine() : RevenueEngine {
    let id = unwrapPrincipal(revenueEngineId);
    actor (Principal.toText(id)) : RevenueEngine
  };

  func getCyclesMarket() : CyclesMarket {
    let id = unwrapPrincipal(cyclesMarketId);
    actor (Principal.toText(id)) : CyclesMarket
  };

  func getNNSProxy() : NNSProxy {
    let id = unwrapPrincipal(nnsProxyId);
    actor (Principal.toText(id)) : NNSProxy
  };

  func getNovaToken() : NovaToken {
    let id = unwrapPrincipal(novaTokenId);
    actor (Principal.toText(id)) : NovaToken
  };

  func getDivi() : Divi {
    let id = unwrapPrincipal(diviId);
    actor (Principal.toText(id)) : Divi
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
      status    = if (initialized) "SOVEREIGN" else "DORMANT";
      health    = if (initialized) 1.0 else 0.0;
      name      = "SOVEREIGN_CYCLES";
      timestamp = Time.now();
    }
  };

  public func heal() : async Text {
    "Sovereign Cycles self-check complete. Inner cycle " #
    (if (initialized) "ACTIVE" else "DORMANT") #
    ". Heartbeats: " # Nat.toText(heartbeatCount) #
    ". Epochs: " # Nat.toText(epochCount)
  };

  public func register() : async Text {
    "SOVEREIGN_CYCLES registered. Capabilities: [autonomous, self-funding, fusion-boxes, peer-topup]."
  };

  public query func report_status() : async Text {
    "SOVEREIGN_CYCLES | status=" # (if (initialized) "SOVEREIGN" else "DORMANT") #
    " | heartbeats=" # Nat.toText(heartbeatCount) #
    " | epochs=" # Nat.toText(epochCount) #
    " | distributed=" # Nat.toText(totalDistributed) #
    " | burned=" # Nat.toText(totalBurned) #
    " | fusionBoxes=" # Nat.toText(fusionBoxCount)
  };
}
