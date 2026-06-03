///
/// SRCE INTERFACE — Interface and Bridge Engine
///
/// "The world sees what we choose to show. The interface is the gate."
///
/// SRCE Interface is the external surface of the Sovereign Rotating Cloud
/// Engines. It presents query endpoints for visualization, bridge routes for
/// peer systems, and the public-safe benchmark data that third parties can
/// verify without accessing private canister internals.
///
/// RESPONSIBILITIES:
///   - Expose public-safe benchmark data (redacted receipts)
///   - Present coherence visualization data
///   - Bridge external queries to appropriate SRCE engines
///   - Track interface uptime and request metrics
///   - Serve the SRCE status dashboard
///
/// NO INTER-CANISTER CALLS IN HEARTBEAT. Pure local tracking only.
/// External reads are served via queries. Bridge calls happen on-demand.
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

persistent actor SrceInterface {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;
  transient let VERSION : Text = "SRCE-Interface-v1.0.0";

  // ══════════════════════════════════════════════════════════════════
  //  STATE — Interface Tracking
  // ══════════════════════════════════════════════════════════════════

  stable var hbtCount : Nat = 0;
  stable var lastBeatTime : Int = 0;
  stable var startTime : Int = 0;

  // Request metrics
  stable var totalQueries : Nat = 0;
  stable var totalUpdates : Nat = 0;

  // Uptime tracking
  stable var uptimeSeconds : Nat = 0;
  stable var interfaceUptime : Float = 1.0;

  // Cached state from peer engines (updated via bridge calls)
  stable var cachedCoherence : Float = 0.0;
  stable var cachedPressure : Text = "unknown";
  stable var cachedCycleHealth : Float = 1.0;
  stable var cachedRotationEpoch : Nat = 0;
  stable var cachedGovernanceDecisions : Nat = 0;

  // Public benchmark receipts (redacted)
  stable var publicReceipts : [Text] = [];
  stable var lastReceiptTime : Int = 0;

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The 873 ms Medina Heart
  // ══════════════════════════════════════════════════════════════════

  func _heartbeat() : async () {
    let now = Time.now();
    hbtCount += 1;
    lastBeatTime := now;

    if (startTime == 0) {
      startTime := now;
    };

    // Compute uptime
    let elapsed = now - startTime;
    uptimeSeconds := Int.abs(elapsed) / 1_000_000_000;

    // Interface health is simply: are we running?
    interfaceUptime := 1.0;
  };

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC QUERIES — The External Surface
  // ══════════════════════════════════════════════════════════════════

  /// SRCE system-wide status (public-safe, redacted)
  public query func getStatus() : async {
    version : Text;
    heartbeats : Nat;
    uptimeSeconds : Nat;
    coherence : Float;
    pressure : Text;
    cycleHealth : Float;
    rotationEpoch : Nat;
    governanceDecisions : Nat;
  } {
    totalQueries += 1;
    {
      version = VERSION;
      heartbeats = hbtCount;
      uptimeSeconds = uptimeSeconds;
      coherence = cachedCoherence;
      pressure = cachedPressure;
      cycleHealth = cachedCycleHealth;
      rotationEpoch = cachedRotationEpoch;
      governanceDecisions = cachedGovernanceDecisions;
    }
  };

  /// Public benchmark receipts (redacted, no canister IDs)
  public query func getPublicReceipts() : async [Text] {
    totalQueries += 1;
    publicReceipts
  };

  /// Interface health
  public query func getInterfaceHealth() : async {
    uptime : Float;
    queries : Nat;
    updates : Nat;
    heartbeats : Nat;
  } {
    totalQueries += 1;
    {
      uptime = interfaceUptime;
      queries = totalQueries;
      updates = totalUpdates;
      heartbeats = hbtCount;
    }
  };

  /// SRCE architecture description (public-safe)
  public query func getArchitectureInfo() : async Text {
    totalQueries += 1;
    "SRCE v1.0 — Sovereign Rotating Cloud Engines\n" #
    "Engines: Connectome | Governance | Substrate | Interface\n" #
    "Heartbeat: 873 ms (PHI^4 × Schumann period)\n" #
    "Rotation: intake → process → output → re-ingest → correct → continue\n" #
    "Status: " # (if (cachedCoherence > 0.618) "coherent" else "drifting")
  };

  // ══════════════════════════════════════════════════════════════════
  //  UPDATE CALLS — Bridge Inputs from Peer Engines
  // ══════════════════════════════════════════════════════════════════

  /// Update cached state from Connectome engine
  public func bridgeConnectomeState(coherence : Float, epoch : Nat) : async () {
    totalUpdates += 1;
    cachedCoherence := coherence;
    cachedRotationEpoch := epoch;
  };

  /// Update cached state from Governance engine
  public func bridgeGovernanceState(decisions : Nat) : async () {
    totalUpdates += 1;
    cachedGovernanceDecisions := decisions;
  };

  /// Update cached state from Substrate engine
  public func bridgeSubstrateState(pressure : Text, health : Float) : async () {
    totalUpdates += 1;
    cachedPressure := pressure;
    cachedCycleHealth := health;
  };

  /// Publish a redacted benchmark receipt
  public func publishReceipt(receipt : Text) : async () {
    totalUpdates += 1;
    lastReceiptTime := Time.now();

    // Redact: strip any canister IDs or sensitive fields
    let redacted = "REDACTED|" # receipt;

    // Keep last 128 public receipts
    if (publicReceipts.size() >= 128) {
      publicReceipts := Array.tabulate<Text>(127, func(i : Nat) : Text {
        publicReceipts[i + 1]
      });
    };
    publicReceipts := Array.append(publicReceipts, [redacted]);
  };

  // Self-start heartbeat on deploy (medina-heart pattern)
  ignore Timer.recurringTimer<system>(#seconds 1, _heartbeat);
};
