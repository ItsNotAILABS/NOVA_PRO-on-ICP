///
/// SRCE GOVERNANCE — Governance and Maintenance Engine
///
/// "Governance is not permission. Governance is discipline."
///
/// SRCE Governance coordinates maintenance, correction, upgrade pressure,
/// and internal agent scheduling for the Sovereign Rotating Cloud Engines.
/// It monitors peer engine health, schedules corrections to the Connectome,
/// and tracks upgrade readiness.
///
/// RESPONSIBILITIES:
///   - Monitor heartbeat continuity across all SRCE engines
///   - Schedule corrections when coherence drifts below threshold
///   - Track upgrade pressure (when canister state approaches limits)
///   - Maintain the correction queue for the Connectome engine
///   - Log governance decisions for benchmark receipt generation
///
/// NO INTER-CANISTER CALLS IN HEARTBEAT. Pure local math only.
/// Governance reads peer state via queries on a separate schedule.
/// Correction signals are emitted as local state that peers consume.
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

persistent actor SrceGovernance {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — Governance Thresholds
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;

  // Coherence threshold — below this, corrections are triggered
  transient let COHERENCE_THRESHOLD : Float = 0.618; // 1/PHI

  // Upgrade pressure threshold — heartbeat misses before flagging
  transient let UPGRADE_PRESSURE_LIMIT : Nat = 10;

  // Maximum correction queue depth
  transient let MAX_CORRECTION_QUEUE : Nat = 32;

  // ══════════════════════════════════════════════════════════════════
  //  STATE — Governance Ledger
  // ══════════════════════════════════════════════════════════════════

  stable var hbtCount : Nat = 0;
  stable var lastBeatTime : Int = 0;

  // Governance decisions log
  stable var decisionLog : [Text] = [];
  stable var totalDecisions : Nat = 0;

  // Correction signals (consumed by Connectome)
  stable var pendingCorrections : [Float] = [];

  // Engine health tracking (reported by operator or peer queries)
  stable var connectomeCoherence : Float = 1.0;
  stable var connectomeMissedBeats : Nat = 0;
  stable var substrateCycleHealth : Float = 1.0;
  stable var interfaceUptime : Float = 1.0;

  // Upgrade pressure
  stable var upgradePressure : Nat = 0;
  stable var upgradeRecommended : Bool = false;

  // Maintenance schedule
  stable var maintenanceEpoch : Nat = 0;
  stable var lastMaintenanceTime : Int = 0;

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The 873 ms Medina Heart
  // ══════════════════════════════════════════════════════════════════

  func _heartbeat() : async () {
    let now = Time.now();
    hbtCount += 1;
    lastBeatTime := now;

    _runGovernanceCycle(now);
  };

  // ══════════════════════════════════════════════════════════════════
  //  GOVERNANCE CYCLE — Evaluate and Decide
  // ══════════════════════════════════════════════════════════════════

  func _runGovernanceCycle(now : Int) {
    // 1. Evaluate connectome health
    if (connectomeCoherence < COHERENCE_THRESHOLD) {
      _emitCorrection(0.1 * PHI); // golden nudge
      _logDecision(now, "coherence_correction:nudge=" # Float.toText(0.1 * PHI));
    };

    // 2. Evaluate missed-beat pressure
    if (connectomeMissedBeats > UPGRADE_PRESSURE_LIMIT) {
      upgradePressure += 1;
      if (upgradePressure > 3) {
        upgradeRecommended := true;
        _logDecision(now, "upgrade_recommended:pressure=" # Nat.toText(upgradePressure));
      };
    } else {
      // Decay pressure when health is good
      if (upgradePressure > 0) {
        upgradePressure -= 1;
      };
    };

    // 3. Maintenance scheduling (every 100 heartbeats)
    if (hbtCount % 100 == 0) {
      maintenanceEpoch += 1;
      lastMaintenanceTime := now;
      _logDecision(now, "maintenance_epoch:" # Nat.toText(maintenanceEpoch));
    };
  };

  func _emitCorrection(nudge : Float) {
    if (pendingCorrections.size() < MAX_CORRECTION_QUEUE) {
      pendingCorrections := Array.append(pendingCorrections, [nudge]);
    };
  };

  func _logDecision(now : Int, decision : Text) {
    totalDecisions += 1;
    let entry = Nat.toText(totalDecisions) # "|" #
                Int.toText(now) # "|" # decision;
    // Keep last 256 decisions
    if (decisionLog.size() >= 256) {
      decisionLog := Array.tabulate<Text>(255, func(i : Nat) : Text {
        decisionLog[i + 1]
      });
    };
    decisionLog := Array.append(decisionLog, [entry]);
  };

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC QUERIES — Peer Engine Interface
  // ══════════════════════════════════════════════════════════════════

  public query func getPendingCorrections() : async [Float] {
    pendingCorrections
  };

  public query func getUpgradePressure() : async {
    pressure : Nat;
    recommended : Bool;
  } {
    { pressure = upgradePressure; recommended = upgradeRecommended }
  };

  public query func getDecisionLog() : async [Text] {
    decisionLog
  };

  public query func getGovernanceStats() : async {
    heartbeats : Nat;
    decisions : Nat;
    maintenanceEpoch : Nat;
    upgradePressure : Nat;
  } {
    {
      heartbeats = hbtCount;
      decisions = totalDecisions;
      maintenanceEpoch = maintenanceEpoch;
      upgradePressure = upgradePressure;
    }
  };

  // ══════════════════════════════════════════════════════════════════
  //  UPDATE CALLS — Health Reports from Peer Engines
  // ══════════════════════════════════════════════════════════════════

  public func reportConnectomeHealth(coh : Float, missed : Nat) : async () {
    connectomeCoherence := coh;
    connectomeMissedBeats := missed;
  };

  public func reportSubstrateHealth(cycleHealth : Float) : async () {
    substrateCycleHealth := cycleHealth;
  };

  public func reportInterfaceHealth(uptime : Float) : async () {
    interfaceUptime := uptime;
  };

  public func consumeCorrections() : async [Float] {
    let corrections = pendingCorrections;
    pendingCorrections := [];
    corrections
  };

  public func resetUpgradePressure() : async () {
    upgradePressure := 0;
    upgradeRecommended := false;
  };

  ignore Timer.recurringTimer<system>(#seconds 1, _heartbeat);
};
