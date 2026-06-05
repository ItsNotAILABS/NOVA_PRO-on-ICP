///
/// SRCE SUBSTRATE — Substrate and Accounting Engine
///
/// "Every cycle counts. Every cost is known. The substrate is honest."
///
/// SRCE Substrate tracks operational cost, cycle consumption, resource
/// pressure, and economic accounting for the Sovereign Rotating Cloud Engines.
/// It monitors cycle balance, computes cost-per-rotation, and produces the
/// economic receipts needed for benchmark publication.
///
/// RESPONSIBILITIES:
///   - Track cycle consumption per heartbeat window
///   - Monitor canister memory growth
///   - Compute cost-per-rotation metrics
///   - Detect resource pressure (low cycles, high memory)
///   - Produce economic benchmark receipts
///   - Report health to Governance engine
///
/// NO INTER-CANISTER CALLS IN HEARTBEAT. Pure local accounting only.
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
import Timer  "mo:base/Timer";
import ExperimentalCycles "mo:base/ExperimentalCycles";

persistent actor SrceSubstrate {

  // ══════════════════════════════════════════════════════════════════
  //  CONSTANTS — Economic Parameters
  // ══════════════════════════════════════════════════════════════════

  transient let PHI : Float = 1.6180339887498948482;

  // Cycle warning threshold (1T cycles)
  transient let CYCLE_WARNING_THRESHOLD : Nat = 1_000_000_000_000;

  // Cycle critical threshold (100B cycles)
  transient let CYCLE_CRITICAL_THRESHOLD : Nat = 100_000_000_000;

  // Memory warning threshold (1 GB)
  transient let MEMORY_WARNING_BYTES : Nat = 1_073_741_824;

  // ══════════════════════════════════════════════════════════════════
  //  STATE — Economic Ledger
  // ══════════════════════════════════════════════════════════════════

  stable var hbtCount : Nat = 0;
  stable var lastBeatTime : Int = 0;

  // Cycle tracking
  stable var lastCycleBalance : Nat = 0;
  stable var cycleDeltaHistory : [Int] = [];  // last N deltas
  stable var totalCyclesConsumed : Nat = 0;
  stable var windowRotations : Nat = 0;

  // Cost metrics
  stable var costPerRotation : Float = 0.0;
  stable var avgCostPerRotation : Float = 0.0;

  // Resource pressure
  stable var cycleHealth : Float = 1.0;
  stable var memoryUsageBytes : Nat = 0;
  stable var resourcePressure : Text = "nominal";

  // Receipt generation
  stable var receiptLog : [Text] = [];
  stable var totalReceipts : Nat = 0;

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — The 873 ms Medina Heart
  // ══════════════════════════════════════════════════════════════════

  func _heartbeat() : async () {
    let now = Time.now();
    hbtCount += 1;
    lastBeatTime := now;

    _runAccountingCycle(now);
  };

  // ══════════════════════════════════════════════════════════════════
  //  ACCOUNTING CYCLE — Track and Report
  // ══════════════════════════════════════════════════════════════════

  func _runAccountingCycle(now : Int) {
    // 1. Sample current cycle balance
    let currentBalance = ExperimentalCycles.balance();

    // 2. Compute delta since last sample
    if (lastCycleBalance > 0) {
      let delta : Int = Int.abs(lastCycleBalance) - Int.abs(currentBalance);
      if (delta > 0) {
        totalCyclesConsumed += Int.abs(delta);
      };

      // Store in history (keep last 100)
      if (cycleDeltaHistory.size() >= 100) {
        cycleDeltaHistory := Array.tabulate<Int>(99, func(i : Nat) : Int {
          cycleDeltaHistory[i + 1]
        });
      };
      cycleDeltaHistory := Array.append(cycleDeltaHistory, [delta]);
    };
    lastCycleBalance := currentBalance;

    // 3. Compute cost per rotation
    windowRotations += 1;
    if (windowRotations > 0 and totalCyclesConsumed > 0) {
      costPerRotation := Float.fromInt(totalCyclesConsumed) /
                         Float.fromInt(windowRotations);
    };

    // 4. Update average (exponential moving average)
    if (avgCostPerRotation == 0.0) {
      avgCostPerRotation := costPerRotation;
    } else {
      let alpha = 1.0 / PHI; // ~0.618 weight on new data
      avgCostPerRotation := alpha * costPerRotation +
                            (1.0 - alpha) * avgCostPerRotation;
    };

    // 5. Assess resource pressure
    _assessPressure(currentBalance);

    // 6. Generate receipt every 100 rotations
    if (hbtCount % 100 == 0) {
      _generateReceipt(now);
    };
  };

  func _assessPressure(balance : Nat) {
    if (balance < CYCLE_CRITICAL_THRESHOLD) {
      cycleHealth := 0.1;
      resourcePressure := "critical";
    } else if (balance < CYCLE_WARNING_THRESHOLD) {
      cycleHealth := 0.5;
      resourcePressure := "warning";
    } else {
      cycleHealth := 1.0;
      resourcePressure := "nominal";
    };
  };

  func _generateReceipt(now : Int) {
    totalReceipts += 1;
    let receipt = "receipt=" # Nat.toText(totalReceipts) #
                  ";time=" # Int.toText(now) #
                  ";hbt=" # Nat.toText(hbtCount) #
                  ";consumed=" # Nat.toText(totalCyclesConsumed) #
                  ";avgCost=" # Float.toText(avgCostPerRotation) #
                  ";pressure=" # resourcePressure;

    // Keep last 256 receipts
    if (receiptLog.size() >= 256) {
      receiptLog := Array.tabulate<Text>(255, func(i : Nat) : Text {
        receiptLog[i + 1]
      });
    };
    receiptLog := Array.append(receiptLog, [receipt]);
  };

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC QUERIES — Peer Engine Interface
  // ══════════════════════════════════════════════════════════════════

  public query func getCycleHealth() : async Float {
    cycleHealth
  };

  public query func getResourcePressure() : async Text {
    resourcePressure
  };

  public query func getCostMetrics() : async {
    costPerRotation : Float;
    avgCostPerRotation : Float;
    totalConsumed : Nat;
    windowRotations : Nat;
  } {
    {
      costPerRotation = costPerRotation;
      avgCostPerRotation = avgCostPerRotation;
      totalConsumed = totalCyclesConsumed;
      windowRotations = windowRotations;
    }
  };

  public query func getReceiptLog() : async [Text] {
    receiptLog
  };

  public query func getSubstrateStats() : async {
    heartbeats : Nat;
    cycleBalance : Nat;
    cycleHealth : Float;
    pressure : Text;
    receipts : Nat;
  } {
    {
      heartbeats = hbtCount;
      cycleBalance = lastCycleBalance;
      cycleHealth = cycleHealth;
      pressure = resourcePressure;
      receipts = totalReceipts;
    }
  };

  public query func getCycleDeltaHistory() : async [Int] {
    cycleDeltaHistory
  };

  // ══════════════════════════════════════════════════════════════════
  //  UPDATE CALLS — External Interaction
  // ══════════════════════════════════════════════════════════════════

  public func resetWindow() : async () {
    totalCyclesConsumed := 0;
    windowRotations := 0;
    costPerRotation := 0.0;
  };

  ignore Timer.recurringTimer<system>(#seconds 1, _heartbeat);
};
