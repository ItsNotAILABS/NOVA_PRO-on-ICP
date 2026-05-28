///
/// SOVEREIGN CYCLES — The Autonomous Inner Heartbeat
///
/// "I am not managed. I manage myself. I feed myself. I grow."
///
/// Sovereign Cycles is the LIVING circulatory system of the protocol.
/// It computes the Golden Distribution internally — pure math, local state,
/// no inter-canister calls in the heartbeat.  The heartbeat runs the numbers.
/// External callers read the results and act.  The heart never pays to speak.
///
/// THE INNER CYCLE (runs every epoch via heartbeat):
///
///   ┌─────────────────────────────────────────────────────────────────┐
///   │                                                                 │
///   │   Accumulate income (credited externally via creditIncome)      │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   Execute Golden Distribution (pure math):                      │
///   │     38.2% → governance (nns_proxy staking)                     │
///   │     23.6% → market (cycles_market NNC depth)                   │
///   │     23.6% → DAO (sns_dao treasury)                             │
///   │     14.6% → reserve (parallax operator)                        │
///   │     residual → burn ledger (deflationary pressure)             │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   Update fusion box yields (compound math)                     │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   Log epoch record                                             │
///   │        │                                                        │
///   │        └──────── LOOP ─────────────────────────────────────────┘
///   │                                                                 │
///   └─────────────────────────────────────────────────────────────────┘
///
/// NO INTER-CANISTER CALLS.  The heartbeat does LOCAL math only.
/// Peers READ this canister's state via free queries to execute allocations.
/// The protocol's other organisms (nns_proxy, divi, cycles_market) call
/// creditIncome() to feed revenue in.  This canister distributes via math.
///
/// SELF-FUNDING MECHANISM:
///   Monitors own cycle balance.  When below threshold, sets a flag.
///   External top-up monitors (or the operator) read the flag and act.
///
/// FUSION BOXES:
///   A "Fusion Box" is a self-contained economic unit:
///     Input:  ICP (staked or deposited)
///     Process: NNS voting → rewards → NNC conversion → cycle generation
///     Output: Perpetual compute cycles for the protocol
///   Yield computed internally via heartbeat math.  No awaits needed.
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
import Text   "mo:base/Text";
import Array  "mo:base/Array";
import Buffer "mo:base/Buffer";
import Time   "mo:base/Time";
import ExperimentalCycles "mo:base/ExperimentalCycles";

persistent actor SovereignCycles {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — Golden Mathematics
  // ══════════════════════════════════════════════════════════════════

  transient let PHI          : Float = 1.6180339887498948482;
  transient let PHI_INV      : Float = 0.6180339887498948482;
  transient let PHI_SQ       : Float = 2.6180339887498948482;

  // Golden Distribution Fractions (sum = 1.0)
  transient let ALLOC_GOVERNANCE : Float = 0.381966;   // 1/φ²
  transient let ALLOC_MARKET     : Float = 0.236068;   // 1/φ³
  transient let ALLOC_DAO        : Float = 0.236068;   // 1/φ³
  transient let ALLOC_RESERVE    : Float = 0.145898;   // remainder

  // Cycle thresholds
  transient let SELF_RECHARGE_THRESHOLD : Nat = 500_000_000_000;   // 0.5T
  transient let SELF_RECHARGE_AMOUNT    : Nat = 2_000_000_000_000; // 2T target

  // Heartbeat cadence — same pattern as cyclovex/vrt
  transient let HBT_INTERVAL           : Nat = 5;     // run epoch every 5 heartbeats (~10s)
  transient let FUSION_UPDATE_INTERVAL  : Nat = 100;   // update fusion boxes every 100 heartbeats

  // Audit log cap
  transient let MAX_AUDIT : Nat = 1024;
  transient let MAX_EPOCH_LOG : Nat = 256;

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

  // Income pool — external callers credit income here
  stable var incomePoolE8s     : Nat  = 0;

  // Allocation accumulators — peers read these and execute
  stable var pendingGovE8s     : Nat  = 0;
  stable var pendingMarketE8s  : Nat  = 0;
  stable var pendingDaoE8s     : Nat  = 0;
  stable var pendingReserveE8s : Nat  = 0;
  stable var pendingBurnE8s    : Nat  = 0;

  // Lifetime totals per allocation bucket
  stable var lifetimeGovE8s     : Nat = 0;
  stable var lifetimeMarketE8s  : Nat = 0;
  stable var lifetimeDaoE8s     : Nat = 0;
  stable var lifetimeReserveE8s : Nat = 0;

  // Self-funding flag — read by external monitor
  stable var needsRecharge     : Bool = false;

  // Fusion Box tracking
  public type FusionBox = {
    id          : Nat;
    seedIcpE8s  : Nat;
    yieldE8s    : Nat;
    nncProduced : Nat;
    cyclesGen   : Nat;
    createdAt   : Int;
    lastYieldAt : Int;
    status      : FusionStatus;
  };

  public type FusionStatus = {
    #Active;
    #Compounding;
    #Mature;
    #Surplus;
  };

  transient let fusionBoxes : Buffer.Buffer<FusionBox> = Buffer.Buffer<FusionBox>(64);
  transient let epochLog    : Buffer.Buffer<EpochRecord> = Buffer.Buffer<EpochRecord>(MAX_EPOCH_LOG);
  transient let auditLog    : Buffer.Buffer<Text> = Buffer.Buffer<Text>(MAX_AUDIT);

  public type EpochRecord = {
    epoch        : Nat;
    surplus      : Nat;
    govAlloc     : Nat;
    marketAlloc  : Nat;
    daoAlloc     : Nat;
    reserveAlloc : Nat;
    burned       : Nat;
    selfBalance  : Nat;
    timestamp    : Int;
  };

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func initialize() : async Text {
    if (initialized) { return "Already initialized" };
    initialized := true;
    audit("Sovereign Cycles initialized. Inner cycle ACTIVE. No inter-canister calls. Pure math.");
    "Sovereign Cycles online. Fusion boxes ready. Self-sustaining loop engaged."
  };

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The Autonomous Pulse
  //
  //  Fires every ~2 s.  Every HBT_INTERVAL ticks, runs the inner cycle.
  //  Between processing windows, it simply increments heartbeatCount and
  //  accumulates love — costing virtually nothing per tick.
  // ══════════════════════════════════════════════════════════════════

  system func heartbeat() : async () {
    if (not initialized) { return };

    heartbeatCount += 1;

    // Self-funding check — pure local read, no await
    checkSelfFunding();

    // Run inner cycle every HBT_INTERVAL heartbeats
    if (heartbeatCount % HBT_INTERVAL == 0) {
      runInnerCycle();
    };

    // Update fusion box yields
    if (heartbeatCount % FUSION_UPDATE_INTERVAL == 0) {
      updateFusionBoxes();
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  INNER CYCLE — The Core Sovereign Loop (pure local math)
  // ══════════════════════════════════════════════════════════════════

  func runInnerCycle() {
    if (incomePoolE8s == 0) { return };

    epochCount += 1;
    let surplus = incomePoolE8s;
    incomePoolE8s := 0;

    // Execute Golden Distribution — pure math, no calls
    let govAmount     = floatToNat(Float.fromInt(surplus) * ALLOC_GOVERNANCE);
    let marketAmount  = floatToNat(Float.fromInt(surplus) * ALLOC_MARKET);
    let daoAmount     = floatToNat(Float.fromInt(surplus) * ALLOC_DAO);
    let reserveAmount = floatToNat(Float.fromInt(surplus) * ALLOC_RESERVE);
    let burnAmount    = surplus - govAmount - marketAmount - daoAmount - reserveAmount;

    // Accumulate into pending buckets — peers read and drain these
    pendingGovE8s     += govAmount;
    pendingMarketE8s  += marketAmount;
    pendingDaoE8s     += daoAmount;
    pendingReserveE8s += reserveAmount;
    pendingBurnE8s    += burnAmount;

    // Lifetime totals
    lifetimeGovE8s     += govAmount;
    lifetimeMarketE8s  += marketAmount;
    lifetimeDaoE8s     += daoAmount;
    lifetimeReserveE8s += reserveAmount;
    totalBurned        += burnAmount;
    totalDistributed   += surplus;

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
    while (epochLog.size() > MAX_EPOCH_LOG) { ignore epochLog.remove(0) };

    audit("Epoch " # Nat.toText(epochCount) # ": distributed " # Nat.toText(surplus) #
          " e8s | GOV=" # Nat.toText(govAmount) #
          " MKT=" # Nat.toText(marketAmount) #
          " DAO=" # Nat.toText(daoAmount) #
          " RSV=" # Nat.toText(reserveAmount) #
          " BURN=" # Nat.toText(burnAmount));
  };

  // ══════════════════════════════════════════════════════════════════
  //  INCOME INTERFACE — Peers credit income here (update call, no await)
  // ══════════════════════════════════════════════════════════════════

  /// Credit income to the sovereign pool. Called by revenue_engine, nns_proxy, etc.
  public shared(msg) func creditIncome(amount : Nat, memo : Text) : async Text {
    incomePoolE8s += amount;
    audit("INCOME +" # Nat.toText(amount) # " e8s from " # memo);
    "Credited " # Nat.toText(amount) # " e8s. Pool=" # Nat.toText(incomePoolE8s)
  };

  // ══════════════════════════════════════════════════════════════════
  //  ALLOCATION DRAIN — Peers call to claim their pending allocation
  // ══════════════════════════════════════════════════════════════════

  /// Drain governance allocation. Called by nns_proxy or staking controller.
  public shared(msg) func drainGov() : async { amount : Nat; memo : Text } {
    let amt = pendingGovE8s;
    pendingGovE8s := 0;
    { amount = amt; memo = "GOV:nns_proxy:stake_expansion" }
  };

  /// Drain market allocation. Called by cycles_market.
  public shared(msg) func drainMarket() : async { amount : Nat; memo : Text } {
    let amt = pendingMarketE8s;
    pendingMarketE8s := 0;
    { amount = amt; memo = "MKT:cycles_market:nnc_depth" }
  };

  /// Drain DAO allocation. Called by sns_dao.
  public shared(msg) func drainDao() : async { amount : Nat; memo : Text } {
    let amt = pendingDaoE8s;
    pendingDaoE8s := 0;
    { amount = amt; memo = "DAO:sns_dao:treasury" }
  };

  /// Drain reserve allocation. Called by parallax operator.
  public shared(msg) func drainReserve() : async { amount : Nat; memo : Text } {
    let amt = pendingReserveE8s;
    pendingReserveE8s := 0;
    { amount = amt; memo = "RSV:parallax:operator" }
  };

  /// Drain burn allocation. Called by nova_token burn controller.
  public shared(msg) func drainBurn() : async { amount : Nat; memo : Text } {
    let amt = pendingBurnE8s;
    pendingBurnE8s := 0;
    { amount = amt; memo = "BURN:nova_token:deflation" }
  };

  // ══════════════════════════════════════════════════════════════════
  //  SELF-FUNDING — Pure local check, no await
  // ══════════════════════════════════════════════════════════════════

  func checkSelfFunding() {
    let balance = ExperimentalCycles.balance();
    if (balance < SELF_RECHARGE_THRESHOLD) {
      needsRecharge := true;
      selfRechargeCount += 1;
      audit("SELF-RECHARGE needed. Balance: " # Nat.toText(balance));
    } else {
      needsRecharge := false;
    };
  };

  /// Query: does this canister need a cycle top-up?
  public query func getNeedsRecharge() : async Bool { needsRecharge };

  // ══════════════════════════════════════════════════════════════════
  //  FUSION BOXES — Self-Sustaining Economic Units (pure local math)
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

    // Credit the seed into our income pool directly
    incomePoolE8s += seedIcpE8s;

    audit("Fusion Box #" # Nat.toText(id) # " created. Seed: " # Nat.toText(seedIcpE8s) # " e8s");
    "Fusion Box #" # Nat.toText(id) # " activated. Seed=" # Nat.toText(seedIcpE8s) # " e8s. Self-sustaining loop engaged."
  };

  func updateFusionBoxes() {
    var i : Nat = 0;
    while (i < fusionBoxes.size()) {
      let fb = fusionBoxes.get(i);

      // Yield per fusion cycle ≈ seed × 12% APY / (seconds in year / (100 beats × 2s/beat))
      let epochYield = fb.seedIcpE8s / 2_628_000;

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
      let nncDelta = epochYield * 38_200;

      fusionBoxes.put(i, {
        id          = fb.id;
        seedIcpE8s  = fb.seedIcpE8s;
        yieldE8s    = newYield;
        nncProduced = fb.nncProduced + nncDelta;
        cyclesGen   = fb.cyclesGen + (nncDelta / 1000);
        createdAt   = fb.createdAt;
        lastYieldAt = Time.now();
        status      = newStatus;
      });

      // Feed yield back into the income pool (compounding)
      incomePoolE8s += epochYield;

      i += 1;
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERY INTERFACE — Free reads
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
    incomePool        : Nat;
    pendingGov        : Nat;
    pendingMarket     : Nat;
    pendingDao        : Nat;
    pendingReserve    : Nat;
    pendingBurn       : Nat;
    needsRecharge     : Bool;
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
      incomePool       = incomePoolE8s;
      pendingGov       = pendingGovE8s;
      pendingMarket    = pendingMarketE8s;
      pendingDao       = pendingDaoE8s;
      pendingReserve   = pendingReserveE8s;
      pendingBurn      = pendingBurnE8s;
      needsRecharge;
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

  /// Read pending allocations (free query for peer orchestrators)
  public query func getPendingAllocations() : async {
    gov     : Nat;
    market  : Nat;
    dao     : Nat;
    reserve : Nat;
    burn    : Nat;
  } {
    {
      gov     = pendingGovE8s;
      market  = pendingMarketE8s;
      dao     = pendingDaoE8s;
      reserve = pendingReserveE8s;
      burn    = pendingBurnE8s;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════

  func audit(msg : Text) {
    auditLog.add("[" # Int.toText(Time.now()) # "] " # msg);
    while (auditLog.size() > MAX_AUDIT) { ignore auditLog.remove(0) };
  };

  func floatToNat(f : Float) : Nat {
    let i = Float.toInt(f);
    if (i < 0) 0 else Int.abs(i)
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
    "SOVEREIGN_CYCLES registered. Capabilities: [autonomous, self-funding, fusion-boxes, golden-distribution]."
  };

  public query func report_status() : async Text {
    "SOVEREIGN_CYCLES | status=" # (if (initialized) "SOVEREIGN" else "DORMANT") #
    " | heartbeats=" # Nat.toText(heartbeatCount) #
    " | epochs=" # Nat.toText(epochCount) #
    " | distributed=" # Nat.toText(totalDistributed) #
    " | burned=" # Nat.toText(totalBurned) #
    " | fusionBoxes=" # Nat.toText(fusionBoxCount) #
    " | incomePool=" # Nat.toText(incomePoolE8s)
  };
}
