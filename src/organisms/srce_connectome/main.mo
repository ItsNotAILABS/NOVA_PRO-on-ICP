///
/// SRCE CONNECTOME — State and Coherence Engine
///
/// "The connectome remembers. The connectome transitions. The connectome IS."
///
/// SRCE Connectome is the state-transition and coherence layer of the
/// Sovereign Rotating Cloud Engines architecture. It maintains the internal
/// phase state, tracks coherence across rotation cycles, and produces the
/// state summaries that other SRCE engines consume.
///
/// ROTATION CYCLE (873 ms target):
///
///   ┌─────────────────────────────────────────────────────────────────┐
///   │                                                                 │
///   │   1. INTAKE — absorb correction signals from governance         │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   2. PROCESS — run phase-coupling coherence math (Kuramoto)     │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   3. OUTPUT — emit state summary and coherence metric           │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   4. RE-INGEST — absorb peer engine feedback                    │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   5. CORRECT — adjust phase drift                               │
///   │        │                                                        │
///   │        ▼                                                        │
///   │   6. CONTINUE — persist and prepare next rotation               │
///   │        │                                                        │
///   │        └──────── LOOP (873 ms) ───────────────────────────────┘
///   │                                                                 │
///   └─────────────────────────────────────────────────────────────────┘
///
/// NO INTER-CANISTER CALLS IN HEARTBEAT. Pure local math only.
/// Peer engines read state via queries. Corrections arrive via update calls.
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
import Timer  "mo:base/Timer";

persistent actor SrceConnectome {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — PHI-Schumann Heartbeat Derivation
  // ══════════════════════════════════════════════════════════════════

  transient let PHI       : Float = 1.6180339887498948482;
  transient let PHI_4     : Float = 6.854101966249685;     // PHI^4
  transient let SCHUMANN  : Float = 7.83;                  // Hz fundamental
  transient let SCHUMANN_PERIOD_MS : Float = 127.7139208;  // 1000/7.83
  transient let HEARTBEAT_MS : Float = 873.0;              // PHI^4 × Schumann period
  transient let HEARTBEAT_NS : Int = 873_000_000;          // nanoseconds

  // Kuramoto coupling constant (1/PHI)
  transient let KAPPA : Float = 0.6180339887498948482;

  // Phase node count — Fibonacci F(6) = 8
  transient let NODE_COUNT : Nat = 8;

  // ══════════════════════════════════════════════════════════════════
  //  STATE — Connectome Phase and Coherence
  // ══════════════════════════════════════════════════════════════════

  stable var hbtCount      : Nat = 0;
  stable var lastBeatTime  : Int = 0;
  stable var missedBeats   : Nat = 0;

  // Phase array — each node has a phase in [0, 2π)
  stable var phases : [Float] = Array.tabulate<Float>(8, func(i : Nat) : Float {
    Float.fromInt(i) * (2.0 * 3.14159265358979323846 / 8.0)
  });

  // Coherence metric R ∈ [0, 1]
  stable var coherence : Float = 0.0;

  // Rotation state
  stable var rotationEpoch : Nat = 0;
  stable var totalDriftCorrections : Nat = 0;

  // Correction queue (from governance engine)
  stable var correctionQueue : [Float] = [];

  // State summary for peer engines
  stable var lastSummary : Text = "";

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The 873 ms Medina Heart
  // ══════════════════════════════════════════════════════════════════

  func _heartbeat() : async () {
    let now = Time.now();
    hbtCount += 1;

    // Check 873 ms interval discipline
    if (lastBeatTime > 0) {
      let delta = now - lastBeatTime;
      let deltaMs = Float.fromInt(delta) / 1_000_000.0;
      // Timer fires at 1s granularity; check if within tolerance
      if (deltaMs > HEARTBEAT_MS * 2.5) {
        missedBeats += 1;
      };
    };
    lastBeatTime := now;

    // Only run rotation logic on correct interval cadence
    // (Timer fires at 1s, rotation math targets 873ms conceptually)
    _runRotation();
  };

  // ══════════════════════════════════════════════════════════════════
  //  ROTATION — The Six-Phase Cycle
  // ══════════════════════════════════════════════════════════════════

  func _runRotation() {
    // 1. INTAKE — absorb corrections
    _intake();

    // 2. PROCESS — Kuramoto phase coupling
    _processCoherence();

    // 3. OUTPUT — compute summary
    _emitSummary();

    // 4-5. RE-INGEST & CORRECT — apply drift correction
    _correctDrift();

    // 6. CONTINUE — advance epoch
    rotationEpoch += 1;
  };

  func _intake() {
    // Corrections from governance engine are consumed here
    // Queue is drained each rotation
    correctionQueue := [];
  };

  func _processCoherence() {
    // Kuramoto model: dθ_i/dt = ω_i + (κ/N) Σ sin(θ_j - θ_i)
    let n = phases.size();
    let newPhases = Array.tabulate<Float>(n, func(i : Nat) : Float {
      var coupling : Float = 0.0;
      for (j in Array.keys(phases)) {
        if (j != i) {
          coupling += Float.sin(phases[j] - phases[i]);
        };
      };
      let dTheta = KAPPA * coupling / Float.fromInt(n);
      var p = phases[i] + dTheta;
      // Wrap to [0, 2π)
      let twoPi = 2.0 * 3.14159265358979323846;
      while (p >= twoPi) { p -= twoPi };
      while (p < 0.0) { p += twoPi };
      p
    });
    phases := newPhases;

    // Compute order parameter R = |1/N Σ e^(iθ_j)|
    var sumCos : Float = 0.0;
    var sumSin : Float = 0.0;
    for (ph in Array.vals(phases)) {
      sumCos += Float.cos(ph);
      sumSin += Float.sin(ph);
    };
    let n_f = Float.fromInt(n);
    let avgCos = sumCos / n_f;
    let avgSin = sumSin / n_f;
    coherence := Float.sqrt(avgCos * avgCos + avgSin * avgSin);
  };

  func _emitSummary() {
    lastSummary := "epoch=" # Nat.toText(rotationEpoch) #
                   ";coherence=" # Float.toText(coherence) #
                   ";hbt=" # Nat.toText(hbtCount) #
                   ";missed=" # Nat.toText(missedBeats);
  };

  func _correctDrift() {
    // If coherence drops below threshold, apply correction
    if (coherence < 0.5) {
      // Nudge all phases toward mean phase
      var sumSin : Float = 0.0;
      var sumCos : Float = 0.0;
      for (ph in Array.vals(phases)) {
        sumCos += Float.cos(ph);
        sumSin += Float.sin(ph);
      };
      let meanPhase = Float.arctan2(sumSin, sumCos);
      let correction = KAPPA * 0.1; // gentle nudge
      phases := Array.tabulate<Float>(phases.size(), func(i : Nat) : Float {
        let diff = meanPhase - phases[i];
        phases[i] + correction * Float.sin(diff)
      });
      totalDriftCorrections += 1;
    };
  };

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC QUERIES — Peer Engine Interface
  // ══════════════════════════════════════════════════════════════════

  public query func getCoherence() : async Float {
    coherence
  };

  public query func getPhases() : async [Float] {
    phases
  };

  public query func getSummary() : async Text {
    lastSummary
  };

  public query func getRotationEpoch() : async Nat {
    rotationEpoch
  };

  public query func getHeartbeatStats() : async {
    count : Nat;
    missed : Nat;
    lastTime : Int;
    driftCorrections : Nat;
  } {
    {
      count = hbtCount;
      missed = missedBeats;
      lastTime = lastBeatTime;
      driftCorrections = totalDriftCorrections;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  UPDATE CALLS — Correction Interface (from Governance Engine)
  // ══════════════════════════════════════════════════════════════════

  public func submitCorrection(phaseNudge : Float) : async () {
    correctionQueue := Array.append(correctionQueue, [phaseNudge]);
  };

  public func resetMissedBeats() : async () {
    missedBeats := 0;
  };

  // Self-start heartbeat on deploy (medina-heart pattern)
  ignore Timer.recurringTimer<system>(#seconds 1, _heartbeat);
};
