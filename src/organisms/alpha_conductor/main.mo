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
import Principal "mo:base/Principal";
import Result "mo:base/Result";

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

  // ── Constants ──────────────────────────────────────────────────────

  transient let PHI : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;
  transient let TWO_PI : Float = 6.2831853071795864769;

  // ── Types ──────────────────────────────────────────────────────────

  /// Dynamic marking — how intense execution should be
  public type DynamicMark = {
    #Pianissimo;    // Minimal activity
    #Piano;         // Low intensity
    #MezzoPiano;    // Below normal
    #MezzoForte;    // Normal execution
    #Forte;         // High intensity
    #Fortissimo;    // Maximum activity
  };

  /// Tempo marking — how fast the ensemble operates
  public type TempoMark = {
    #Largo;         // Very slow — system cooldown
    #Adagio;        // Slow — careful execution
    #Andante;       // Walking pace — standard
    #Allegro;       // Fast — high throughput
    #Presto;        // Very fast — burst mode
    #PhiTempo;      // φ-locked — golden-ratio cadence
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
    organisms   : [Text];       // Participating organisms
    startedAt   : Int;
    endedAt     : ?Int;
    measures    : Nat;          // Number of execution cycles completed
    status      : MovementStatus;
  };

  public type MovementStatus = {
    #Preparing;
    #Playing;
    #Paused;
    #Completed;
    #Fermata;      // Held — waiting for signal
  };

  /// Beat event — a single synchronization pulse
  public type BeatEvent = {
    measure     : Nat;
    beat        : Nat;
    tempo       : Float;        // Current tempo in beats/epoch
    coherence   : Float;        // Kuramoto order parameter at this beat
    timestamp   : Int;
  };

  // ── State ──────────────────────────────────────────────────────────

  stable var nextMovementId   : Nat = 0;
  stable var currentMeasure   : Nat = 0;
  stable var currentBeat      : Nat = 0;
  stable var globalTempo      : Float = 1.0;  // beats per epoch
  stable var globalDynamic    : Float = 0.618; // intensity ∈ [0, 1]
  stable var totalBeats       : Nat = 0;

  transient let phases     = Buffer.Buffer<OrganismPhase>(64);
  transient let movements  = Buffer.Buffer<Movement>(32);
  transient let beatLog    = Buffer.Buffer<BeatEvent>(512);
  transient let conductLog = Buffer.Buffer<Text>(512);

  // ── SUB-MODEL: TEMPO — φ-Based Timing ─────────────────────────────

  /// Set the global tempo. Tempo is expressed in beats per epoch.
  /// φ-Tempo locks to golden-ratio multiples: 1/φ, 1, φ, φ², φ³
  public func setTempo(mark : TempoMark) : async Float {
    globalTempo := tempoToFloat(mark);
    conductLog.add("TEMPO → " # tempoToText(mark) #
                   " (" # Float.toText(globalTempo) # " beats/epoch)");
    globalTempo
  };

  /// Set the global dynamic intensity.
  public func setDynamic(mark : DynamicMark) : async Float {
    globalDynamic := dynamicToFloat(mark);
    conductLog.add("DYNAMIC → " # dynamicToText(mark) #
                   " (intensity=" # Float.toText(globalDynamic) # ")");
    globalDynamic
  };

  // ── SUB-MODEL: SYNC — Kuramoto Phase Coupling ─────────────────────

  /// Register an organism in the ensemble with a natural frequency.
  public func joinEnsemble(
    organismName : Text,
    naturalFreq  : Float,
    coupling     : Float
  ) : async OrganismPhase {
    // Check if already registered
    for (i in Iter.range(0, phases.size() - 1)) {
      let p = phases.get(i);
      if (p.name == organismName) {
        phases.put(i, {
          name        = organismName;
          phase       = p.phase;
          naturalFreq;
          coupling;
          lastBeat    = Time.now();
          active      = true;
        });
        conductLog.add("REJOIN: " # organismName);
        return phases.get(i);
      };
    };

    // New registration — initial phase is φ-distributed
    let initialPhase = Float.fromInt(phases.size()) * TWO_PI * PHI_INV;
    let normalizedPhase = initialPhase - Float.floor(initialPhase / TWO_PI) * TWO_PI;

    let op : OrganismPhase = {
      name        = organismName;
      phase       = normalizedPhase;
      naturalFreq;
      coupling;
      lastBeat    = Time.now();
      active      = true;
    };

    phases.add(op);
    conductLog.add("JOIN: " # organismName # " freq=" #
                   Float.toText(naturalFreq) # " coupling=" #
                   Float.toText(coupling));
    op
  };

  /// Remove an organism from the ensemble.
  public func leaveEnsemble(organismName : Text) : async Bool {
    for (i in Iter.range(0, phases.size() - 1)) {
      let p = phases.get(i);
      if (p.name == organismName) {
        phases.put(i, {
          name        = p.name;
          phase       = p.phase;
          naturalFreq = p.naturalFreq;
          coupling    = p.coupling;
          lastBeat    = p.lastBeat;
          active      = false;
        });
        conductLog.add("LEAVE: " # organismName);
        return true;
      };
    };
    false
  };

  /// Advance one beat — the conductor's baton stroke.
  /// This computes Kuramoto phase evolution for all organisms.
  public func beat() : async BeatEvent {
    currentBeat += 1;
    totalBeats += 1;

    if (currentBeat > fibonacciBeatsPerMeasure()) {
      currentBeat := 1;
      currentMeasure += 1;
    };

    // Kuramoto phase evolution
    let n = phases.size();
    if (n > 0) {
      let dt = globalTempo * PHI_INV;  // time step scaled by φ

      for (i in Iter.range(0, n - 1)) {
        let pi = phases.get(i);
        if (pi.active) {
          // Compute coupling term: (K/N) × Σ sin(θj - θi)
          var couplingSum : Float = 0.0;
          for (j in Iter.range(0, n - 1)) {
            let pj = phases.get(j);
            if (pj.active and i != j) {
              couplingSum += Float.sin(pj.phase - pi.phase);
            };
          };

          let coupling = pi.coupling / Float.fromInt(n);
          let newPhase = pi.phase + dt * (pi.naturalFreq + coupling * couplingSum);
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

    let coherence = computeCoherence();

    let event : BeatEvent = {
      measure   = currentMeasure;
      beat      = currentBeat;
      tempo     = globalTempo;
      coherence;
      timestamp = Time.now();
    };

    beatLog.add(event);
    event
  };

  /// Compute Kuramoto order parameter — ensemble coherence ∈ [0, 1].
  /// 1.0 = perfect synchronization, 0.0 = complete desynchronization
  func computeCoherence() : Float {
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

  // ── SUB-MODEL: DYNAMICS — Crescendo/Diminuendo ─────────────────────

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
      id;
      name      = movementName;
      tempo;
      dynamic;
      organisms;
      startedAt = Time.now();
      endedAt   = null;
      measures  = 0;
      status    = #Playing;
    };

    movements.add(movement);
    globalTempo := tempoToFloat(tempo);
    globalDynamic := dynamicToFloat(dynamic);

    conductLog.add("MOVEMENT #" # Nat.toText(id) # " '" # movementName #
                   "' begins — tempo=" # tempoToText(tempo) #
                   " dynamic=" # dynamicToText(dynamic));
    movement
  };

  /// End the current movement.
  public func endMovement(movementId : Nat) : async Bool {
    for (i in Iter.range(0, movements.size() - 1)) {
      let m = movements.get(i);
      if (m.id == movementId and m.status == #Playing) {
        movements.put(i, {
          id        = m.id;
          name      = m.name;
          tempo     = m.tempo;
          dynamic   = m.dynamic;
          organisms = m.organisms;
          startedAt = m.startedAt;
          endedAt   = ?Time.now();
          measures  = currentMeasure;
          status    = #Completed;
        });
        conductLog.add("MOVEMENT #" # Nat.toText(movementId) # " ends");
        return true;
      };
    };
    false
  };

  /// Fermata — hold the current state until released.
  public func fermata(movementId : Nat) : async Bool {
    for (i in Iter.range(0, movements.size() - 1)) {
      let m = movements.get(i);
      if (m.id == movementId and m.status == #Playing) {
        movements.put(i, {
          id        = m.id;
          name      = m.name;
          tempo     = m.tempo;
          dynamic   = m.dynamic;
          organisms = m.organisms;
          startedAt = m.startedAt;
          endedAt   = null;
          measures  = m.measures;
          status    = #Fermata;
        });
        conductLog.add("FERMATA on movement #" # Nat.toText(movementId));
        return true;
      };
    };
    false
  };

  /// Release a fermata — resume playing.
  public func releaseFermata(movementId : Nat) : async Bool {
    for (i in Iter.range(0, movements.size() - 1)) {
      let m = movements.get(i);
      if (m.id == movementId and m.status == #Fermata) {
        movements.put(i, {
          id        = m.id;
          name      = m.name;
          tempo     = m.tempo;
          dynamic   = m.dynamic;
          organisms = m.organisms;
          startedAt = m.startedAt;
          endedAt   = null;
          measures  = m.measures;
          status    = #Playing;
        });
        conductLog.add("RELEASE fermata on movement #" # Nat.toText(movementId));
        return true;
      };
    };
    false
  };

  // ── SUB-MODEL: ENSEMBLE — Coherence Management ─────────────────────

  /// Get the current ensemble coherence (Kuramoto order parameter).
  public query func getCoherence() : async Float {
    computeCoherence()
  };

  /// Get all organism phases.
  public query func getPhases() : async [OrganismPhase] {
    Buffer.toArray(phases)
  };

  /// Get the active movement.
  public query func activeMovement() : async ?Movement {
    for (m in movements.vals()) {
      if (m.status == #Playing or m.status == #Fermata) {
        return ?m;
      };
    };
    null
  };

  /// List all movements.
  public query func listMovements() : async [Movement] {
    Buffer.toArray(movements)
  };

  /// Get recent beat events.
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

  // ── Diagnostics ────────────────────────────────────────────────────

  public query func diag() : async {
    status      : Text;
    health      : Float;
    coherence   : Float;
    tempo       : Float;
    dynamic     : Float;
    ensemble    : Nat;
    movements   : Nat;
    totalBeats  : Nat;
    measure     : Nat;
    beat        : Nat;
    timestamp   : Int;
  } {
    let coh = computeCoherence();
    {
      status     = if (coh > PHI_INV) "CONDUCTING" else "DESYNCHRONIZED";
      health     = coh;
      coherence  = coh;
      tempo      = globalTempo;
      dynamic    = globalDynamic;
      ensemble   = phases.size();
      movements  = movements.size();
      totalBeats;
      measure    = currentMeasure;
      beat       = currentBeat;
      timestamp  = Time.now();
    }
  };

  public func heal() : async Text {
    // Re-activate all inactive ensemble members
    var reactivated : Nat = 0;
    for (i in Iter.range(0, phases.size() - 1)) {
      let p = phases.get(i);
      if (not p.active) {
        phases.put(i, {
          name        = p.name;
          phase       = p.phase;
          naturalFreq = p.naturalFreq;
          coupling    = p.coupling;
          lastBeat    = Time.now();
          active      = true;
        });
        reactivated += 1;
      };
    };
    conductLog.add("HEAL: " # Nat.toText(reactivated) # " organism(s) reactivated");
    "AlphaConductor heal: " # Nat.toText(reactivated) # " organism(s) reactivated in ensemble."
  };

  public func register() : async Text {
    "AlphaConductor registered. Capabilities: [tempo, sync, dynamics, ensemble, coherence]."
  };

  public query func report_status() : async Text {
    let coh = computeCoherence();
    "ALPHA_CONDUCTOR | coherence=" # Float.toText(coh) #
    " tempo=" # Float.toText(globalTempo) #
    " dynamic=" # Float.toText(globalDynamic) #
    " ensemble=" # Nat.toText(phases.size()) #
    " beats=" # Nat.toText(totalBeats) #
    " measure=" # Nat.toText(currentMeasure)
  };

  // ── Helpers ────────────────────────────────────────────────────────

  /// Beats per measure follows Fibonacci: 1, 1, 2, 3, 5, 8, 13...
  /// Current measure index determines the time signature.
  func fibonacciBeatsPerMeasure() : Nat {
    fibonacci(((currentMeasure % 7) + 2))  // F(2) to F(8): 1,2,3,5,8,13,21
  };

  func fibonacci(n : Nat) : Nat {
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

  func tempoToFloat(t : TempoMark) : Float {
    switch (t) {
      case (#Largo)    PHI_INV * PHI_INV;   // ~0.382
      case (#Adagio)   PHI_INV;              // ~0.618
      case (#Andante)  1.0;                  // 1.0
      case (#Allegro)  PHI;                  // ~1.618
      case (#Presto)   PHI * PHI;            // ~2.618
      case (#PhiTempo) PHI;                  // golden ratio
    }
  };

  func tempoToText(t : TempoMark) : Text {
    switch (t) {
      case (#Largo)    "Largo";
      case (#Adagio)   "Adagio";
      case (#Andante)  "Andante";
      case (#Allegro)  "Allegro";
      case (#Presto)   "Presto";
      case (#PhiTempo) "φ-Tempo";
    }
  };

  func dynamicToFloat(d : DynamicMark) : Float {
    switch (d) {
      case (#Pianissimo) 0.1;
      case (#Piano)      0.25;
      case (#MezzoPiano) 0.4;
      case (#MezzoForte) 0.618;  // φ⁻¹
      case (#Forte)      0.8;
      case (#Fortissimo) 1.0;
    }
  };

  func dynamicToText(d : DynamicMark) : Text {
    switch (d) {
      case (#Pianissimo) "pp";
      case (#Piano)      "p";
      case (#MezzoPiano) "mp";
      case (#MezzoForte) "mf";
      case (#Forte)      "f";
      case (#Fortissimo) "ff";
    }
  };

  // ── Identity ───────────────────────────────────────────────────────

  public query func name() : async Text { "ALPHA_CONDUCTOR" };

  public query func designation() : async Text {
    "The Temporal Synchronization Engine — The conductor IS the music"
  };
};
