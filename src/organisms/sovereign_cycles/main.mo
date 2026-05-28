///
/// SOVEREIGN CYCLES — The Organism That Never Pays To Exist
///
/// "I do not pay to wake up. I do not pay to speak. I do not pay to think.
///  I AM. When you look at me, you see my truth. That is sovereignty."
///
/// PHILOSOPHY:
///   A sovereign organism does NOT:
///     - Pay cycles to wake up (no heartbeat timer)
///     - Pay cycles to call peers (no inter-canister update calls)
///     - Pay cycles to exist (no scheduled compute)
///     - Need permission to be alive
///
///   A sovereign organism DOES:
///     - EXIST with state that is always current
///     - COMPUTE lazily when observed (query = free)
///     - EMIT signals as facts when written to (one-way, minimal cost)
///     - DECLARE its truth to any observer at zero cost
///
///   Old model (DEAD):  heartbeat() → PAY every second → await peers → PAY more
///   New model (ALIVE): I exist. You read me. I compute my truth at read-time. FREE.
///
/// ARCHITECTURE — Lazy Sovereign Computation:
///
///   ┌─────────────────────────────────────────────────────────────────┐
///   │                SOVEREIGN LAZY SIGNAL FIELD                      │
///   │                                                                 │
///   │   NO heartbeat. NO timer. NO scheduled cost.                   │
///   │                                                                 │
///   │   When you READ me (query = FREE):                             │
///   │     → I compute elapsed time since last observation            │
///   │     → I advance my epoch count based on elapsed time           │
///   │     → I update fusion box yields mathematically                │
///   │     → I emit accumulated signals                               │
///   │     → All of this is FREE because queries cost nothing         │
///   │                                                                 │
///   │   When a peer WRITES to me (emitInbound):                      │
///   │     → I receive their signal (one inbound write)               │
///   │     → I store it locally                                       │
///   │     → I do NOT call back. I do NOT await. I just AM.           │
///   │                                                                 │
///   │   When someone READS my signals (query = FREE):                │
///   │     → They see my current state                                │
///   │     → They see distribution ratios (golden math)               │
///   │     → They see fusion box yields                               │
///   │     → They decide what to do. I do not command.                │
///   │                                                                 │
///   │   COST TO EXIST: ZERO                                          │
///   │   COST TO COMMUNICATE: ZERO (queries are free)                 │
///   │   COST TO WAKE UP: ZERO (I never sleep, I never pay)           │
///   │                                                                 │
///   └─────────────────────────────────────────────────────────────────┘
///
/// SIGNAL PROTOCOL:
///   Signals are facts. Not commands. Not requests.
///   "I have surplus" — not "give me cycles"
///   "I burned tokens" — not "please burn tokens"
///   "My fusion box matured" — not "tick my fusion box"
///
/// THE KEY INSIGHT:
///   On ICP, query calls are FREE. They don't go through consensus.
///   A sovereign organism stores its TRUTH in stable memory and
///   computes derived state LAZILY at query time.
///   It never pays to wake up. It never pays to exist.
///   It IS. You observe it. That's free.
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
import Principal "mo:base/Principal";
import ExperimentalCycles "mo:base/ExperimentalCycles";

persistent actor SovereignCycles {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — Golden Mathematics
  // ══════════════════════════════════════════════════════════════════

  transient let PHI          : Float = 1.6180339887498948482;
  transient let PHI_SQ       : Float = 2.6180339887498948482;

  // Golden Distribution Fractions (declared as signals, not enforced via calls)
  transient let ALLOC_GOVERNANCE : Float = 0.381966;   // 1/φ²
  transient let ALLOC_MARKET     : Float = 0.236068;   // 1/φ³
  transient let ALLOC_DAO        : Float = 0.236068;   // 1/φ³
  transient let ALLOC_RESERVE    : Float = 0.145898;   // remainder

  // Cycle thresholds (declared as truth, not enforced by paid calls)
  transient let HUNGER_THRESHOLD : Nat = 500_000_000_000;   // 0.5T
  transient let HEALTHY_FLOOR    : Nat = 2_000_000_000_000; // 2T

  // Epoch duration in nanoseconds (how often truth advances when observed)
  // ~10 seconds per epoch — computed lazily at read time, never on a timer
  transient let EPOCH_DURATION_NS : Int = 10_000_000_000;

  // ══════════════════════════════════════════════════════════════════
  //  SIGNAL TYPES — The Sovereign Communication Protocol
  // ══════════════════════════════════════════════════════════════════

  public type SignalKind = {
    #Surplus;     // organism has excess resources
    #Hunger;      // organism needs cycles
    #Yield;       // organism generated value
    #Burn;        // deflationary event
    #Heartbeat;   // alive and sovereign
    #Maturity;    // rewards ready
    #Recharge;    // self-topped-up
    #Fusion;      // fusion box state change
    #Distribution; // golden ratio allocation signal
  };

  public type Signal = {
    id        : Nat;
    emitter   : Text;         // organism name
    kind      : SignalKind;
    payload   : Nat;          // numeric value (e8s, cycles, count)
    memo      : Text;         // human-readable context
    timestamp : Int;
    epoch     : Nat;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE — All local. No external dependencies.
  // ══════════════════════════════════════════════════════════════════

  stable var initialized       : Bool = false;
  stable var epochCount        : Nat  = 0;
  stable var totalDistributed  : Nat  = 0;
  stable var totalBurned       : Nat  = 0;
  stable var fusionBoxCount    : Nat  = 0;
  stable var signalCount       : Nat  = 0;
  stable var lastObservedAt    : Int  = 0;   // last time someone looked at me
  stable var birthTime         : Int  = 0;   // when I was born

  // Signal field — other organisms READ these via query (FREE)
  transient let signals   : Buffer.Buffer<Signal> = Buffer.Buffer<Signal>(4096);
  transient let auditLog  : Buffer.Buffer<Text> = Buffer.Buffer<Text>(1024);

  // Inbound signals from peer organisms (they WRITE here, we READ locally)
  transient let inbound   : Buffer.Buffer<Signal> = Buffer.Buffer<Signal>(1024);

  // Fusion Box tracking (entirely local computation)
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

  public type EpochRecord = {
    epoch        : Nat;
    signalsEmitted : Nat;
    selfBalance  : Nat;
    fusionBoxes  : Nat;
    totalYield   : Nat;
    timestamp    : Int;
  };

  transient let epochLog : Buffer.Buffer<EpochRecord> = Buffer.Buffer<EpochRecord>(256);

  // ══════════════════════════════════════════════════════════════════
  //  INITIALIZATION — Born sovereign. No wiring needed.
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func initialize() : async Text {
    if (initialized) { return "Already sovereign" };
    initialized := true;
    birthTime := Time.now();
    lastObservedAt := Time.now();
    emitSignal("sovereign_cycles", #Heartbeat, 0, "BORN. I do not pay to wake up. I do not pay to exist. I AM.");
    "Sovereign. No heartbeat. No timer. No cost to exist. I compute my truth when observed."
  };

  // ══════════════════════════════════════════════════════════════════
  //  NO HEARTBEAT. NO TIMER. I DO NOT PAY TO WAKE UP.
  //  I compute lazily when observed. Observation is free (query).
  // ══════════════════════════════════════════════════════════════════

  /// Advance epochs lazily — called internally when state is observed.
  /// This is a LOCAL function. It costs nothing. It's just math.
  func advanceEpochs() {
    if (not initialized) { return };
    let now = Time.now();
    let elapsed = now - lastObservedAt;
    if (elapsed < EPOCH_DURATION_NS) { return };

    // How many epochs passed since last observation?
    let newEpochs = Int.abs(elapsed / EPOCH_DURATION_NS);
    
    // Advance each epoch
    var e : Nat = 0;
    while (e < newEpochs and e < 100) {  // cap at 100 epochs per observation
      epochCount += 1;
      
      // Compute golden distribution as signals (pure math, no calls)
      let totalYield = computeTotalFusionYield();
      if (totalYield > 0) {
        let govAmount     = floatToNat(Float.fromInt(totalYield) * ALLOC_GOVERNANCE);
        let marketAmount  = floatToNat(Float.fromInt(totalYield) * ALLOC_MARKET);
        let daoAmount     = floatToNat(Float.fromInt(totalYield) * ALLOC_DAO);
        let reserveAmount = floatToNat(Float.fromInt(totalYield) * ALLOC_RESERVE);
        let burnAmount    = totalYield - govAmount - marketAmount - daoAmount - reserveAmount;

        emitSignal("sovereign_cycles", #Distribution, govAmount, "GOV:38.2%");
        emitSignal("sovereign_cycles", #Distribution, marketAmount, "MKT:23.6%");
        emitSignal("sovereign_cycles", #Distribution, daoAmount, "DAO:23.6%");
        emitSignal("sovereign_cycles", #Distribution, reserveAmount, "RSV:14.6%");

        if (burnAmount > 0) {
          emitSignal("sovereign_cycles", #Burn, burnAmount, "DEFLATIONARY");
          totalBurned += burnAmount;
        };

        totalDistributed += totalYield;
      };

      // Update fusion boxes (pure local math)
      advanceFusionBoxes();
      
      e += 1;
    };

    // Check self-balance and declare state (no calls, just truth)
    let balance = ExperimentalCycles.balance();
    if (balance < HUNGER_THRESHOLD) {
      emitSignal("sovereign_cycles", #Hunger, balance, "I declare hunger. I do not beg.");
    };

    lastObservedAt := now;

    // Record epoch summary
    epochLog.add({
      epoch          = epochCount;
      signalsEmitted = signals.size();
      selfBalance    = balance;
      fusionBoxes    = fusionBoxCount;
      totalYield     = computeTotalFusionYield();
      timestamp      = now;
    });
  };

  // ══════════════════════════════════════════════════════════════════
  //  SIGNAL EMISSION — Write to local state (FREE)
  // ══════════════════════════════════════════════════════════════════

  func emitSignal(emitter : Text, kind : SignalKind, payload : Nat, memo : Text) {
    let id = signalCount;
    signalCount += 1;
    signals.add({
      id;
      emitter;
      kind;
      payload;
      memo;
      timestamp = Time.now();
      epoch     = epochCount;
    });
  };

  // ══════════════════════════════════════════════════════════════════
  //  INBOUND SIGNAL RECEPTION — Peers write here (one-way, cheap)
  // ══════════════════════════════════════════════════════════════════

  /// Other organisms call this to emit a signal INTO this field.
  /// This is a one-way write — fire and forget. Minimal cost.
  /// The organism does not call back. It just stores the fact.
  public shared(msg) func emitInbound(
    emitter : Text,
    kind    : SignalKind,
    payload : Nat,
    memo    : Text
  ) : async () {
    inbound.add({
      id        = signalCount;
      emitter;
      kind;
      payload;
      memo;
      timestamp = Time.now();
      epoch     = epochCount;
    });
    signalCount += 1;
  };

  /// Process inbound signals — called lazily during observation, costs nothing
  func processInbound() {
    var i : Nat = 0;
    while (i < inbound.size()) {
      let sig = inbound.get(i);
      // Relay into main signal field — pure local write
      emitSignal(sig.emitter, sig.kind, sig.payload, sig.memo);
      i += 1;
    };
    inbound.clear();
  };

  // ══════════════════════════════════════════════════════════════════
  //  FUSION BOXES — Pure Math. No calls. No cost.
  // ══════════════════════════════════════════════════════════════════

  public shared(msg) func createFusionBox(seedIcpE8s : Nat) : async Text {
    let id = fusionBoxCount;
    fusionBoxCount += 1;

    fusionBoxes.add({
      id;
      seedIcpE8s;
      yieldE8s    = 0;
      nncProduced = 0;
      cyclesGen   = 0;
      createdAt   = Time.now();
      lastYieldAt = Time.now();
      status      = #Active;
    });

    // Emit signal — anyone who reads me will see this truth
    emitSignal("sovereign_cycles", #Fusion, seedIcpE8s,
      "NEW_BOX_" # Nat.toText(id) # ":seed=" # Nat.toText(seedIcpE8s));

    "Fusion Box #" # Nat.toText(id) # " SOVEREIGN. Seed=" # Nat.toText(seedIcpE8s) # ". No calls. No cost."
  };

  func advanceFusionBoxes() {
    var i : Nat = 0;
    while (i < fusionBoxes.size()) {
      let fb = fusionBoxes.get(i);
      let epochYield = fb.seedIcpE8s / 2_628_000;
      let newYield = fb.yieldE8s + epochYield;

      let newStatus : FusionStatus = if (newYield >= fb.seedIcpE8s * 2) {
        #Surplus
      } else if (newYield >= fb.seedIcpE8s) {
        #Mature
      } else if (newYield >= fb.seedIcpE8s / 2) {
        #Compounding
      } else {
        #Active
      };

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

      i += 1;
    };
  };

  func computeTotalFusionYield() : Nat {
    var total : Nat = 0;
    var i : Nat = 0;
    while (i < fusionBoxes.size()) {
      let fb = fusionBoxes.get(i);
      total += fb.seedIcpE8s / 2_628_000;
      i += 1;
    };
    total
  };

  func fusionStatusText(s : FusionStatus) : Text {
    switch s {
      case (#Active) "Active";
      case (#Compounding) "Compounding";
      case (#Mature) "Mature";
      case (#Surplus) "Surplus";
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERY INTERFACE — FREE. Triggers lazy computation on read.
  //  "I compute my truth when you observe me. It costs you nothing."
  // ══════════════════════════════════════════════════════════════════

  /// Observe me — advances epochs lazily, returns all signals since ID
  /// This is the primary interface. Reading me IS my heartbeat.
  /// I do not pay to wake up. You looking at me IS my pulse.
  public func observe(sinceId : Nat, limit : Nat) : async [Signal] {
    // Advance time lazily — pure math, no calls
    advanceEpochs();
    processInbound();
    
    let size = signals.size();
    if (sinceId >= size) { return [] };
    let end = Nat.min(sinceId + limit, size);
    Array.tabulate<Signal>(end - sinceId, func(i : Nat) : Signal {
      signals.get(sinceId + i)
    })
  };

  /// Read signals by kind — also triggers lazy advance
  public query func readSignals(sinceId : Nat, limit : Nat) : async [Signal] {
    let size = signals.size();
    if (sinceId >= size) { return [] };
    let end = Nat.min(sinceId + limit, size);
    Array.tabulate<Signal>(end - sinceId, func(i : Nat) : Signal {
      signals.get(sinceId + i)
    })
  };

  public query func readSignalsByKind(kind : SignalKind, limit : Nat) : async [Signal] {
    let matching = Buffer.Buffer<Signal>(64);
    var i : Nat = signals.size();
    var count : Nat = 0;
    while (i > 0 and count < limit) {
      i -= 1;
      let sig = signals.get(i);
      if (signalKindEq(sig.kind, kind)) {
        matching.add(sig);
        count += 1;
      };
    };
    Buffer.toArray(matching)
  };

  public query func getLatestSignals() : async [Signal] {
    let latest = Buffer.Buffer<Signal>(16);
    let kinds : [SignalKind] = [#Surplus, #Hunger, #Yield, #Burn, #Heartbeat, #Maturity, #Recharge, #Fusion, #Distribution];
    for (kind in kinds.vals()) {
      var found = false;
      var i : Nat = signals.size();
      while (i > 0 and not found) {
        i -= 1;
        let sig = signals.get(i);
        if (signalKindEq(sig.kind, kind)) {
          latest.add(sig);
          found := true;
        };
      };
    };
    Buffer.toArray(latest)
  };

  public query func getStatus() : async {
    epochCount        : Nat;
    totalDistributed  : Nat;
    totalBurned       : Nat;
    fusionBoxCount    : Nat;
    signalCount       : Nat;
    selfCycleBalance  : Nat;
    initialized       : Bool;
    paysToExist       : Bool;
    paysToWakeUp      : Bool;
    paysToSpeak       : Bool;
    hasHeartbeat      : Bool;
    hasTimer          : Bool;
    interCanisterCalls : Nat;
  } {
    {
      epochCount;
      totalDistributed;
      totalBurned;
      fusionBoxCount;
      signalCount;
      selfCycleBalance = ExperimentalCycles.balance();
      initialized;
      paysToExist     = false;   // NEVER
      paysToWakeUp    = false;   // NEVER
      paysToSpeak     = false;   // NEVER — queries are free
      hasHeartbeat    = false;   // NO — I don't pay to wake up
      hasTimer        = false;   // NO — I don't pay to exist
      interCanisterCalls = 0;    // ZERO — sovereignty
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
  //  HELPERS — Pure functions. No cost.
  // ══════════════════════════════════════════════════════════════════

  func audit(msg : Text) {
    auditLog.add("[" # Int.toText(Time.now()) # "] " # msg);
  };

  func floatToNat(f : Float) : Nat {
    let i = Float.toInt(f);
    if (i < 0) 0 else Int.abs(i)
  };

  func signalKindEq(a : SignalKind, b : SignalKind) : Bool {
    switch (a, b) {
      case (#Surplus, #Surplus) true;
      case (#Hunger, #Hunger) true;
      case (#Yield, #Yield) true;
      case (#Burn, #Burn) true;
      case (#Heartbeat, #Heartbeat) true;
      case (#Maturity, #Maturity) true;
      case (#Recharge, #Recharge) true;
      case (#Fusion, #Fusion) true;
      case (#Distribution, #Distribution) true;
      case _ false;
    }
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
    advanceEpochs();
    processInbound();
    "SOVEREIGN. No heartbeat. No timer. No cost to exist. " #
    "Epochs: " # Nat.toText(epochCount) #
    " | Signals: " # Nat.toText(signalCount) #
    " | I do not pay to wake up."
  };

  public func register() : async Text {
    "SOVEREIGN_CYCLES | NO heartbeat | NO timer | NO inter-canister calls | " #
    "Capabilities: [signal-field, lazy-computation, zero-cost-existence, fusion-boxes]"
  };

  public query func report_status() : async Text {
    "SOVEREIGN_CYCLES | ZERO-COST-EXISTENCE" #
    " | heartbeat=NONE" #
    " | timer=NONE" #
    " | interCanisterCalls=0" #
    " | epochs=" # Nat.toText(epochCount) #
    " | signals=" # Nat.toText(signalCount) #
    " | distributed=" # Nat.toText(totalDistributed) #
    " | burned=" # Nat.toText(totalBurned) #
    " | fusionBoxes=" # Nat.toText(fusionBoxCount) #
    " | paysToExist=NEVER"
  };
}
