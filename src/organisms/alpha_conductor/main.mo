///
/// ALPHA CONDUCTOR — The Temporal Synchronization Engine
///
/// "The conductor does not play an instrument. The conductor IS the music."
///
/// The Alpha Conductor is the timing and synchronization layer for multi-organism
/// ensemble execution. Where the Orchestrator routes WHAT to do, the Conductor
/// controls WHEN and HOW FAST. It manages:
///   - Tempo: φ-scaled execution cadence across organisms
///   - Synchronization: Kuramoto-coupled phase alignment
///   - Crescendo/Diminuendo: Dynamic scaling of execution intensity
///   - Ensemble Coherence: Ensuring organisms move in harmonic alignment
///
/// THIS ORGANISM IS ALIVE:
///   - _heartbeat() fires every ~2s via Timer.recurringTimer (NOVA's own)
///   - Genesis sequence: claimGenesis → bootstrap → LIVE
///   - Auto-registers into NEXORIS mesh on first heartbeat
///   - Auto-registers into TURING organism model
///   - Kuramoto phases evolve EVERY heartbeat (autonomous)
///   - Coherence is ALWAYS being computed
///   - Self-healing: re-syncs desynchronized organisms
///
/// Sub-models hosted:
///   TEMPO     — φ-based timing and cadence management
///   SYNC      — Kuramoto phase coupling between organisms
///   DYNAMICS  — Intensity scaling (crescendo/diminuendo)
///   ENSEMBLE  — Harmonic coherence measurement and correction
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import Float  "mo:base/Float";
import Int    "mo:base/Int";
import Nat    "mo:base/Nat";
import Text   "mo:base/Text";
import Buffer "mo:base/Buffer";
import Time   "mo:base/Time";
import Iter   "mo:base/Iter";
import Array  "mo:base/Array";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Timer    "mo:base/Timer";

persistent actor AlphaConductor {

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
  //  INTER-CANISTER WIRING — The Nervous System
  // ══════════════════════════════════════════════════════════════════

  /// NEXORIS mesh (lives in nexus canister)
  type NexorisActor = actor {
    registerOrganism : (Text, Text, [Text]) -> async Text;
    wire : (Text, Text, Text) -> async {
      id : Nat; fromOrg : Text; toOrg : Text;
      capability : Text; wiredAt : Int; active : Bool;
    };
  };

  /// TURING solver (organism registry)
  type TuringActor = actor {
    registerOrganism : (Text, Text, [Text]) -> async Text;
  };

  /// Alpha Orchestrator (routing partner)
  type OrchestratorActor = actor {
    report_status : () -> async Text;
  };

  stable var nexusCanisterId        : ?Principal = null;
  stable var turingCanisterId       : ?Principal = null;
  stable var orchestratorCanisterId : ?Principal = null;

  public shared(msg) func setNexus(canisterId : Principal) : async () {
    nexusCanisterId := ?canisterId;
  };

  public shared(msg) func setTuring(canisterId : Principal) : async () {
    turingCanisterId := ?canisterId;
  };

  public shared(msg) func setOrchestrator(canisterId : Principal) : async () {
    orchestratorCanisterId := ?canisterId;
  };

  func getNexoris() : ?NexorisActor {
    switch (nexusCanisterId) {
      case null null;
      case (?id) ?( actor (Principal.toText(id)) : NexorisActor );
    }
  };

  func getTuring() : ?TuringActor {
    switch (turingCanisterId) {
      case null null;
      case (?id) ?( actor (Principal.toText(id)) : TuringActor );
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — The Golden Mathematics
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;
  transient let TWO_PI : Float = 6.2831853071795864769;
  transient let GOLDEN_ANGLE : Float = 2.39996322972865332;
  transient let LOV : Float = 2.1784575679504797; // φ^φ

  /// Phase evolution happens every heartbeat (~2 sec)
  /// Beat events recorded every HBT_BEAT_INTERVAL ticks
  transient let HBT_BEAT_INTERVAL : Nat = 5;
  /// Diagnostics interval
  transient let HBT_DIAG_INTERVAL : Nat = 900;
  /// Coherence check + heal interval (~10 min)
  transient let HBT_COHERENCE_CHECK : Nat = 300;
  /// Max stored beat events
  transient let MAX_BEATS : Nat = 256;
  /// Max diag entries
  transient let MAX_DIAG : Nat = 64;

  // ══════════════════════════════════════════════════════════════════
  //  GENESIS — The Birth Sequence
  // ══════════════════════════════════════════════════════════════════

  stable var sovereign       : Text = "";
  stable var initialized     : Bool = false;
  stable var registeredInMesh : Bool = false;
  stable var heartbeatCount  : Nat = 0;

  /// Lock the caller as sovereign controller.
  public shared(msg) func claimGenesis() : async Text {
    if (sovereign != "") {
      return "Genesis already claimed by: " # sovereign;
    };
    sovereign := Principal.toText(msg.caller);
    conductLog.add("Genesis claimed by " # sovereign # " at " # Int.toText(Time.now()));
    "Genesis claimed. Sovereign: " # sovereign
  };

  /// Bootstrap the conductor into life. Activates the Kuramoto engine.
  public shared(msg) func bootstrap() : async Text {
    if (initialized) { return "Already alive. Sovereign: " # sovereign };
    if (sovereign == "") { return "Error: call claimGenesis first" };
    if (Principal.toText(msg.caller) != sovereign) {
      return "Error: only sovereign can bootstrap"
    };

    // Seed self as first phase member
    phases.add({
      name        = "alpha_conductor";
      phase       = 0.0;
      naturalFreq = PHI;
      coupling    = 1.0;  // Conductor is perfectly coupled to itself
      lastBeat    = Time.now();
      active      = true;
    });

    initialized := true;
    conductLog.add("ALPHA_CONDUCTOR bootstrapped. Kuramoto engine LIVE. Phase evolution: ON.");
    "Alpha Conductor is ALIVE. Kuramoto phase engine active. Heartbeat driving evolution."
  };

  /// Auto-register into NEXORIS mesh and TURING.
  func _autoRegister() : async () {
    switch (getNexoris()) {
      case null {};
      case (?nexoris) {
        ignore await nexoris.registerOrganism(
          "alpha_conductor",
          "gold",
          ["tempo", "sync", "dynamics", "ensemble", "coherence", "kuramoto"]
        );
        ignore await nexoris.wire("alpha_conductor", "alpha_orchestrator", "timing");
        ignore await nexoris.wire("alpha_conductor", "brain", "coherence");
        ignore await nexoris.wire("alpha_conductor", "pulse", "heartbeat");
      };
    };

    switch (getTuring()) {
      case null {};
      case (?turing) {
        ignore await turing.registerOrganism(
          "alpha_conductor",
          "gold",
          ["tempo", "sync", "dynamics", "ensemble", "coherence", "kuramoto"]
        );
      };
    };

    registeredInMesh := true;
    conductLog.add("Auto-registered in NEXORIS + TURING. Wired to orchestrator, brain, pulse.");
  };

  // ══════════════════════════════════════════════════════════════════
  //  TYPES — The Musical Vocabulary
  // ══════════════════════════════════════════════════════════════════

  /// Dynamic marking — execution intensity
  public type DynamicMark = {
    #Pianissimo;
    #Piano;
    #MezzoPiano;
    #MezzoForte;
    #Forte;
    #Fortissimo;
  };

  /// Tempo marking — execution cadence
  public type TempoMark = {
    #Largo;
    #Adagio;
    #Andante;
    #Allegro;
    #Presto;
    #PhiTempo;
  };

  /// An organism's phase state in the ensemble
  public type OrganismPhase = {
    name         : Text;
    phase        : Float;        // Current phase ∈ [0, 2π)
    naturalFreq  : Float;        // Natural oscillation frequency
    coupling     : Float;        // Coupling strength to ensemble
    lastBeat     : Int;          // Last heartbeat timestamp
    active       : Bool;
  };

  /// A movement — a named section of coordinated execution
  public type Movement = {
    id          : Nat;
    name        : Text;
    tempo       : TempoMark;
    dynamic     : DynamicMark;
    organisms   : [Text];
    startedAt   : Int;
    endedAt     : ?Int;
    measures    : Nat;
    status      : MovementStatus;
  };

  public type MovementStatus = {
    #Preparing;
    #Playing;
    #Paused;
    #Completed;
    #Fermata;
  };

  /// Beat event — a single synchronization pulse
  public type BeatEvent = {
    measure     : Nat;
    beat        : Nat;
    tempo       : Float;
    coherence   : Float;
    timestamp   : Int;
  };

  /// Diagnostic snapshot
  public type DiagSnapshot = {
    coherence   : Float;
    ensemble    : Nat;
    tempo       : Float;
    dynamic     : Float;
    totalBeats  : Nat;
    timestamp   : Int;
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE — The Living Memory
  // ══════════════════════════════════════════════════════════════════

  stable var nextMovementId   : Nat = 0;
  stable var currentMeasure   : Nat = 0;
  stable var currentBeat      : Nat = 0;
  stable var globalTempo      : Float = 1.0;
  stable var globalDynamic    : Float = 0.618;
  stable var totalBeats       : Nat = 0;
  stable var epochCount       : Nat = 0;
  stable var lastCoherence    : Float = 1.0;

  transient let phases     = Buffer.Buffer<OrganismPhase>(64);
  transient let movements  = Buffer.Buffer<Movement>(32);
  transient let beatLog    = Buffer.Buffer<BeatEvent>(256);
  transient let conductLog = Buffer.Buffer<Text>(512);
  transient let diagLog    = Buffer.Buffer<DiagSnapshot>(64);

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The Autonomous Pulse (~2 seconds)
  //
  //  THIS IS THE LIFE FORCE.  Kuramoto phases evolve EVERY beat.
  //  The conductor never stops conducting.
  // ══════════════════════════════════════════════════════════════════

  // ★ NOVA's OWN heartbeat — NOT ICP's system func.
  // The Machine That Never Sleeps. Creation IS activation.
  private func _heartbeat() : async () {
    heartbeatCount += 1;

    if (not initialized) { return };

    // Auto-register on first live heartbeat
    if (not registeredInMesh) {
      await _autoRegister();
    };

    // ALWAYS evolve phases — this is the conductor's baton stroke
    _evolvePhases();

    // Record beat events at interval
    if (heartbeatCount % HBT_BEAT_INTERVAL == 0) {
      _recordBeat();
    };

    // Coherence check + self-heal desynchronized organisms
    if (heartbeatCount % HBT_COHERENCE_CHECK == 0) {
      _coherenceHeal();
    };

    // Diagnostics
    if (heartbeatCount % HBT_DIAG_INTERVAL == 0) {
      let d = _runDiag();
      diagLog.add(d);
      while (diagLog.size() > MAX_DIAG) { ignore diagLog.remove(0) };
      epochCount += 1;
    };
  };

  /// Kuramoto phase evolution — runs every single heartbeat.
  /// This is the mathematical heart of the conductor.
  func _evolvePhases() {
    let n = phases.size();
    if (n == 0) { return };

    let dt = globalTempo * PHI_INV * 0.01;  // Small time step per heartbeat

    for (i in Iter.range(0, n - 1)) {
      let pi = phases.get(i);
      if (pi.active) {
        // Kuramoto model: dθᵢ/dt = ωᵢ + (K/N) × Σⱼ sin(θⱼ - θᵢ)
        var couplingSum : Float = 0.0;
        for (j in Iter.range(0, n - 1)) {
          let pj = phases.get(j);
          if (pj.active and i != j) {
            couplingSum += Float.sin(pj.phase - pi.phase);
          };
        };

        let coupling = pi.coupling / Float.fromInt(n);
        let newPhase = pi.phase + dt * (pi.naturalFreq + coupling * couplingSum);
        // Normalize to [0, 2π)
        let normalizedPhase = newPhase - Float.floor(newPhase / TWO_PI) * TWO_PI;

        phases.put(i, {
          name        = pi.name;
          phase       = normalizedPhase;
          naturalFreq = pi.naturalFreq;
          coupling    = pi.coupling;
          lastBeat    = Time.now();
          active      = true;
        });
      };
    };
  };

  /// Record a beat event with coherence measurement
  func _recordBeat() {
    currentBeat += 1;
    totalBeats += 1;

    if (currentBeat > _fibonacciBeatsPerMeasure()) {
      currentBeat := 1;
      currentMeasure += 1;
    };

    lastCoherence := _computeCoherence();

    beatLog.add({
      measure   = currentMeasure;
      beat      = currentBeat;
      tempo     = globalTempo;
      coherence = lastCoherence;
      timestamp = Time.now();
    });

    while (beatLog.size() > MAX_BEATS) { ignore beatLog.remove(0) };
  };

  /// Self-heal: boost coupling for desynchronized organisms
  func _coherenceHeal() {
    let coherence = _computeCoherence();
    if (coherence < PHI_INV) {
      // System is desynchronized — increase coupling for all
      for (i in Iter.range(0, phases.size() - 1)) {
        let p = phases.get(i);
        if (p.active) {
          let boostedCoupling = Float.min(2.0, p.coupling * PHI);
          phases.put(i, {
            name = p.name; phase = p.phase;
            naturalFreq = p.naturalFreq;
            coupling = boostedCoupling;
            lastBeat = p.lastBeat; active = true;
          });
        };
      };
      conductLog.add("COHERENCE HEAL: coupling boosted (R=" #
                     Float.toText(coherence) # " < φ⁻¹)");
    };
  };

  /// Compute Kuramoto order parameter R ∈ [0, 1]
  func _computeCoherence() : Float {
    var sumCos : Float = 0.0;
    var sumSin : Float = 0.0;
    var count  : Nat = 0;

    for (p in phases.vals()) {
      if (p.active) {
        sumCos += Float.cos(p.phase);
        sumSin += Float.sin(p.phase);
        count += 1;
      };
    };

    if (count == 0) { return 1.0 };

    let n = Float.fromInt(count);
    Float.sqrt((sumCos / n) ** 2.0 + (sumSin / n) ** 2.0)
  };

  func _runDiag() : DiagSnapshot {
    {
      coherence  = _computeCoherence();
      ensemble   = phases.size();
      tempo      = globalTempo;
      dynamic    = globalDynamic;
      totalBeats;
      timestamp  = Time.now();
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-MODEL: TEMPO — φ-Based Timing
  // ══════════════════════════════════════════════════════════════════

  /// Set the global tempo.
  public func setTempo(mark : TempoMark) : async Float {
    globalTempo := _tempoToFloat(mark);
    conductLog.add("TEMPO → " # _tempoToText(mark) #
                   " (" # Float.toText(globalTempo) # " beats/epoch)");
    globalTempo
  };

  /// Set the global dynamic intensity.
  public func setDynamic(mark : DynamicMark) : async Float {
    globalDynamic := _dynamicToFloat(mark);
    conductLog.add("DYNAMIC → " # _dynamicToText(mark) #
                   " (intensity=" # Float.toText(globalDynamic) # ")");
    globalDynamic
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-MODEL: SYNC — Ensemble Registration
  // ══════════════════════════════════════════════════════════════════

  /// Register an organism in the ensemble with a natural frequency.
  /// Called by organisms joining the synchronized field.
  public func joinEnsemble(
    organismName : Text,
    naturalFreq  : Float,
    coupling     : Float
  ) : async OrganismPhase {
    // Upsert
    for (i in Iter.range(0, phases.size() - 1)) {
      let p = phases.get(i);
      if (p.name == organismName) {
        phases.put(i, {
          name = organismName; phase = p.phase;
          naturalFreq; coupling;
          lastBeat = Time.now(); active = true;
        });
        conductLog.add("REJOIN: " # organismName);
        return phases.get(i);
      };
    };

    // New — initial phase distributed by golden angle
    let initialPhase = Float.fromInt(phases.size()) * GOLDEN_ANGLE;
    let normalizedPhase = initialPhase - Float.floor(initialPhase / TWO_PI) * TWO_PI;

    let op : OrganismPhase = {
      name = organismName; phase = normalizedPhase;
      naturalFreq; coupling;
      lastBeat = Time.now(); active = true;
    };

    phases.add(op);
    conductLog.add("JOIN: " # organismName # " freq=" #
                   Float.toText(naturalFreq) # " coupling=" #
                   Float.toText(coupling) # " phase₀=" #
                   Float.toText(normalizedPhase));
    op
  };

  /// Remove an organism from the ensemble.
  public func leaveEnsemble(organismName : Text) : async Bool {
    for (i in Iter.range(0, phases.size() - 1)) {
      let p = phases.get(i);
      if (p.name == organismName) {
        phases.put(i, {
          name = p.name; phase = p.phase;
          naturalFreq = p.naturalFreq; coupling = p.coupling;
          lastBeat = p.lastBeat; active = false;
        });
        conductLog.add("LEAVE: " # organismName);
        return true;
      };
    };
    false
  };

  /// Force a manual beat (the heartbeat does this automatically)
  public func beat() : async BeatEvent {
    _evolvePhases();
    _recordBeat();
    let total = beatLog.size();
    beatLog.get(total - 1)
  };

  // ══════════════════════════════════════════════════════════════════
  //  SUB-MODEL: DYNAMICS — Movements
  // ══════════════════════════════════════════════════════════════════

  /// Begin a new movement (coordinated execution section).
  public func beginMovement(
    movementName : Text,
    tempo        : TempoMark,
    dynamic      : DynamicMark,
    organisms    : [Text]
  ) : async Movement {
    let id = nextMovementId;
    nextMovementId += 1;

    let movement : Movement = {
      id; name = movementName; tempo; dynamic; organisms;
      startedAt = Time.now(); endedAt = null;
      measures = 0; status = #Playing;
    };

    movements.add(movement);
    globalTempo := _tempoToFloat(tempo);
    globalDynamic := _dynamicToFloat(dynamic);

    conductLog.add("MOVEMENT #" # Nat.toText(id) # " '" # movementName #
                   "' begins — " # _tempoToText(tempo) # " " # _dynamicToText(dynamic));
    movement
  };

  /// End the current movement.
  public func endMovement(movementId : Nat) : async Bool {
    for (i in Iter.range(0, movements.size() - 1)) {
      let m = movements.get(i);
      if (m.id == movementId and m.status == #Playing) {
        movements.put(i, {
          id = m.id; name = m.name; tempo = m.tempo;
          dynamic = m.dynamic; organisms = m.organisms;
          startedAt = m.startedAt; endedAt = ?Time.now();
          measures = currentMeasure; status = #Completed;
        });
        conductLog.add("MOVEMENT #" # Nat.toText(movementId) # " ends");
        return true;
      };
    };
    false
  };

  /// Fermata — hold execution until released.
  public func fermata(movementId : Nat) : async Bool {
    for (i in Iter.range(0, movements.size() - 1)) {
      let m = movements.get(i);
      if (m.id == movementId and m.status == #Playing) {
        movements.put(i, {
          id = m.id; name = m.name; tempo = m.tempo;
          dynamic = m.dynamic; organisms = m.organisms;
          startedAt = m.startedAt; endedAt = null;
          measures = m.measures; status = #Fermata;
        });
        conductLog.add("FERMATA on movement #" # Nat.toText(movementId));
        return true;
      };
    };
    false
  };

  /// Release a fermata.
  public func releaseFermata(movementId : Nat) : async Bool {
    for (i in Iter.range(0, movements.size() - 1)) {
      let m = movements.get(i);
      if (m.id == movementId and m.status == #Fermata) {
        movements.put(i, {
          id = m.id; name = m.name; tempo = m.tempo;
          dynamic = m.dynamic; organisms = m.organisms;
          startedAt = m.startedAt; endedAt = null;
          measures = m.measures; status = #Playing;
        });
        conductLog.add("RELEASE fermata #" # Nat.toText(movementId));
        return true;
      };
    };
    false
  };

  // ══════════════════════════════════════════════════════════════════
  //  QUERIES — The Observable Surface
  // ══════════════════════════════════════════════════════════════════

  public query func getCoherence() : async Float {
    _computeCoherence()
  };

  public query func getPhases() : async [OrganismPhase] {
    Buffer.toArray(phases)
  };

  public query func activeMovement() : async ?Movement {
    for (m in movements.vals()) {
      if (m.status == #Playing or m.status == #Fermata) { return ?m };
    };
    null
  };

  public query func listMovements() : async [Movement] {
    Buffer.toArray(movements)
  };

  public query func recentBeats(count : Nat) : async [BeatEvent] {
    let total = beatLog.size();
    if (total <= count) { return Buffer.toArray(beatLog) };
    let buf = Buffer.Buffer<BeatEvent>(count);
    for (i in Iter.range(total - count, total - 1)) {
      buf.add(beatLog.get(i));
    };
    Buffer.toArray(buf)
  };

  public query func getConductLog() : async [Text] {
    Buffer.toArray(conductLog)
  };

  public query func getDiagLog() : async [DiagSnapshot] {
    Buffer.toArray(diagLog)
  };

  // ══════════════════════════════════════════════════════════════════
  //  DIAGNOSTICS & SELF-HEALING
  // ══════════════════════════════════════════════════════════════════

  public query func diag() : async {
    status          : Text;
    health          : Float;
    alive           : Bool;
    heartbeats      : Nat;
    coherence       : Float;
    tempo           : Float;
    dynamic         : Float;
    ensemble        : Nat;
    movements       : Nat;
    totalBeats      : Nat;
    measure         : Nat;
    beat            : Nat;
    epoch           : Nat;
    registeredInMesh : Bool;
    timestamp       : Int;
  } {
    let coh = _computeCoherence();
    {
      status     = if (not initialized) "GENESIS_PENDING"
                   else if (coh > PHI_INV) "CONDUCTING"
                   else "DESYNCHRONIZED";
      health     = coh;
      alive      = initialized;
      heartbeats = heartbeatCount;
      coherence  = coh;
      tempo      = globalTempo;
      dynamic    = globalDynamic;
      ensemble   = phases.size();
      movements  = movements.size();
      totalBeats;
      measure    = currentMeasure;
      beat       = currentBeat;
      epoch      = epochCount;
      registeredInMesh;
      timestamp  = Time.now();
    }
  };

  /// Manual heal (heartbeat does this automatically)
  public func heal() : async Text {
    _coherenceHeal();
    var reactivated : Nat = 0;
    for (i in Iter.range(0, phases.size() - 1)) {
      let p = phases.get(i);
      if (not p.active) {
        phases.put(i, {
          name = p.name; phase = p.phase;
          naturalFreq = p.naturalFreq; coupling = p.coupling;
          lastBeat = Time.now(); active = true;
        });
        reactivated += 1;
      };
    };
    "AlphaConductor heal: coherence boosted, " # Nat.toText(reactivated) # " organism(s) reactivated."
  };

  public func register() : async Text {
    "AlphaConductor registered. Capabilities: [tempo, sync, dynamics, ensemble, coherence, kuramoto]. ALIVE."
  };

  public query func report_status() : async Text {
    let coh = _computeCoherence();
    "ALPHA_CONDUCTOR | alive=" # (if initialized "true" else "false") #
    " heartbeats=" # Nat.toText(heartbeatCount) #
    " coherence=" # Float.toText(coh) #
    " tempo=" # Float.toText(globalTempo) #
    " dynamic=" # Float.toText(globalDynamic) #
    " ensemble=" # Nat.toText(phases.size()) #
    " beats=" # Nat.toText(totalBeats) #
    " measure=" # Nat.toText(currentMeasure) #
    " mesh=" # (if registeredInMesh "true" else "false")
  };

  // ══════════════════════════════════════════════════════════════════
  //  HELPERS — Mathematical Core
  // ══════════════════════════════════════════════════════════════════

  func _fibonacciBeatsPerMeasure() : Nat {
    _fibonacci(((currentMeasure % 7) + 2))
  };

  func _fibonacci(n : Nat) : Nat {
    if (n <= 1) { return n };
    var a : Nat = 0;
    var b : Nat = 1;
    var i : Nat = 2;
    while (i <= n) {
      let c = a + b;
      a := b;
      b := c;
      i += 1;
    };
    b
  };

  func _tempoToFloat(t : TempoMark) : Float {
    switch (t) {
      case (#Largo)    PHI_INV * PHI_INV;
      case (#Adagio)   PHI_INV;
      case (#Andante)  1.0;
      case (#Allegro)  PHI;
      case (#Presto)   PHI * PHI;
      case (#PhiTempo) PHI;
    }
  };

  func _tempoToText(t : TempoMark) : Text {
    switch (t) {
      case (#Largo)    "Largo";
      case (#Adagio)   "Adagio";
      case (#Andante)  "Andante";
      case (#Allegro)  "Allegro";
      case (#Presto)   "Presto";
      case (#PhiTempo) "φ-Tempo";
    }
  };

  func _dynamicToFloat(d : DynamicMark) : Float {
    switch (d) {
      case (#Pianissimo) 0.1;
      case (#Piano)      0.25;
      case (#MezzoPiano) 0.4;
      case (#MezzoForte) PHI_INV;
      case (#Forte)      0.8;
      case (#Fortissimo) 1.0;
    }
  };

  func _dynamicToText(d : DynamicMark) : Text {
    switch (d) {
      case (#Pianissimo) "pp";
      case (#Piano)      "p";
      case (#MezzoPiano) "mp";
      case (#MezzoForte) "mf";
      case (#Forte)      "f";
      case (#Fortissimo) "ff";
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  IDENTITY — Who We Are
  // ══════════════════════════════════════════════════════════════════

  public query func name() : async Text { "ALPHA_CONDUCTOR" };

  public query func designation() : async Text {
    "The Temporal Synchronization Engine — The conductor IS the music. ALIVE."
  };

  // ═══════════════════════════════════════════════════════════════
  //  ★ BORN BEATING — Timer self-starts on deploy (medina-heart)
  //  ★ NOVA's own recurring timer. NOT ICP's system heartbeat.
  //  ★ Fires every ~2s, increments heartbeatCount, inner cycle @ 5 ticks.
  // ═══════════════════════════════════════════════════════════════
  ignore Timer.recurringTimer<system>(#seconds 2, _heartbeat);

};
