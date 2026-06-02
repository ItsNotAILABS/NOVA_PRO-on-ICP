///
/// TOKEN ECONOMICS CANISTER — On-Chain Economic Parameter Engine
///
/// This canister is the on-chain implementation of the Alpha Economics Charter (AEC-2026).
/// It stores all φ-constants and behavioral parameters, exposes economic state queries,
/// runs behavioral models (prospect theory utility functions), and produces real-time
/// economic health metrics for the protocol.
///
/// Functions:
///   getEconomicState()      — Full economic health report
///   simulateIncentive()     — Run prospect theory simulation for a scenario
///   calculateOptimalFee()   — Ramsey pricing for a given elasticity
///   getVelocityMetrics()    — Current velocity and decomposition
///   getPriceLevels()        — φ-harmonic support/resistance levels
///   getBehavioralParams()   — Export all behavioral parameters
///   getEpochBudget()        — Current epoch issuance budget
///   recordTransaction()     — Record a transaction for velocity tracking
///   runEpochReport()        — Generate end-of-epoch economic report
///
/// Heartbeat Pattern:
///   Uses Timer.recurringTimer<system>(#seconds 2, _heartbeat)
///   Heartbeat does LOCAL math only — updates counters, checks thresholds.
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
import Result "mo:base/Result";

persistent actor TokenEconomics {

  // ══════════════════════════════════════════════════════════════════
  //  CPL RUNTIME WIRING
  // ══════════════════════════════════════════════════════════════════
  stable var cplRuntimeCanisterId : ?Principal = null;

  public type PulsePriority = { #Low; #Normal; #High; #Critical };
  public type ProofResult = { #Passed; #Failed; #Blocked; #Partial };
  public type MemoryType = { #Precedent; #Pattern; #Consequence; #Alert; #Constraint; #Exception };

  type CPLRuntime = actor {
    createPulse : (Text, [Text], Text, [Text], [Text], Text, Text, Text,
                   PulsePriority, Nat, Nat, Nat, Bool)
                   -> async Result.Result<Text, Text>;
  };

  public shared(msg) func setCPLRuntime(canisterId : Principal) : async () {
    cplRuntimeCanisterId := ?canisterId;
  };


  // ══════════════════════════════════════════════════════════════════
  //  φ CONSTANTS — Immutable Economic Parameters
  // ══════════════════════════════════════════════════════════════════

  transient let PHI     : Float = 1.6180339887498948482;
  transient let PHI_INV : Float = 0.6180339887498948482;  // 1/φ
  transient let PHI_SQ  : Float = 2.6180339887498948482;  // φ²
  transient let PHI_CB  : Float = 4.2360679774997896964;  // φ³
  transient let PHI_4   : Float = 6.8541019662496845446;  // φ⁴

  // Supply constants (from nova_token)
  transient let TOTAL_SUPPLY_E8S : Nat = 52_100_196_600;
  transient let TREASURY_E8S     : Nat = 19_918_285_500;
  transient let COMMUNITY_E8S    : Nat = 12_297_756_900;
  transient let FOUNDER_E8S      : Nat = 19_884_154_200;
  transient let E8S_PER_NOVA     : Nat = 100_000_000;
  transient let TRANSFER_FEE     : Nat = 10_000;

  // Fibonacci sequence
  transient let FIBONACCI : [Nat] = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

  // ══════════════════════════════════════════════════════════════════
  //  BEHAVIORAL PARAMETERS (from BE-AEC-2026)
  // ══════════════════════════════════════════════════════════════════

  public type BehavioralParams = {
    gainSensitivity     : Float;  // α = 1/φ
    lossSensitivity     : Float;  // β = 1/φ
    lossAversion        : Float;  // λ = φ²
    probWeightGamma     : Float;  // γ = 1/φ
    discountRate        : Float;  // k = 1/φ
    anchorWeight        : Float;  // w = 1/φ
    endowmentMultiplier : Float;  // ε = φ³
    herdingExponent     : Float;  // h = φ
    defaultStakeRatio   : Float;  // 1/φ³
    socialProofThreshold: Float;  // 1/φ
  };

  // ══════════════════════════════════════════════════════════════════
  //  STATE — Economic Tracking
  // ══════════════════════════════════════════════════════════════════

  stable var currentEpoch       : Nat  = 0;
  stable var epochStartTime     : Int  = 0;
  stable var txCountThisEpoch   : Nat  = 0;
  stable var txVolumeThisEpoch  : Nat  = 0;  // in e8s
  stable var totalBurnedTracked : Nat  = 0;
  stable var totalLockedTracked : Nat  = 0;
  stable var hbtCount           : Nat  = 0;

  // Velocity tracking (last 5 epochs)
  stable var epochVolumes : [Nat] = [0, 0, 0, 0, 0];

  // Price tracking
  stable var lastKnownPrice     : Float = 1.0;  // NOVA/ICP
  stable var treasuryICP        : Float = 0.0;
  stable var steadyEarnings     : Float = 0.0;

  // ══════════════════════════════════════════════════════════════════
  //  TYPES
  // ══════════════════════════════════════════════════════════════════

  public type EconomicState = {
    // Velocity
    velocity            : Float;
    velocityTarget      : Float;
    velocityStatus      : Text;

    // Supply
    circulatingSupply   : Nat;
    totalBurned         : Nat;
    totalLocked         : Nat;
    lockupRatio         : Float;

    // Price
    fundamentalPrice    : Float;
    marketPrice         : Float;
    priceDeviation      : Float;
    priceZone           : Text;
    supportLevel        : Float;
    resistanceLevel     : Float;

    // Epoch
    currentEpoch        : Nat;
    epochBudget         : Nat;
    epochTxCount        : Nat;

    // Behavioral
    lossAversionParam   : Float;
    discountRate        : Float;

    // Protocol
    heartbeatCount      : Nat;
    timestamp           : Int;
  };

  public type IncentiveSimulation = {
    scenarioName  : Text;
    potentialLoss : Float;
    potentialGain : Float;
    perceivedLoss : Float;
    perceivedGain : Float;
    netPerceived  : Float;
    isAttractive  : Bool;
    requiredReward: Float;
  };

  public type VelocityMetrics = {
    currentVelocity   : Float;
    rollingVelocity   : Float;
    status            : Text;
    recommendation    : Text;
    decomposition     : Text;
  };

  public type PriceLevels = {
    fundamental   : Float;
    support1      : Float;
    support2      : Float;
    support3      : Float;
    resistance1   : Float;
    resistance2   : Float;
    resistance3   : Float;
    fibLevels     : [(Text, Float)];
  };

  // ══════════════════════════════════════════════════════════════════
  //  CORE ECONOMICS FUNCTIONS
  // ══════════════════════════════════════════════════════════════════

  /// Prospect theory value function
  func prospectValue(x : Float) : Float {
    if (x >= 0.0) {
      Float.pow(x, PHI_INV)  // x^(1/φ) for gains
    } else {
      -PHI_SQ * Float.pow(-x, PHI_INV)  // -λ × (-x)^(1/φ) for losses
    }
  };

  /// Hyperbolic discount factor
  func hyperbolicDiscount(t : Float) : Float {
    1.0 / (1.0 + PHI_INV * t)
  };

  /// Epoch issuance budget
  func epochBudget(epoch : Nat) : Nat {
    if (epoch > 12) { return 0 };
    // Normalization sum: Σ(PHI_INV^k, k=0..12)
    var normSum : Float = 0.0;
    var k : Nat = 0;
    while (k <= 12) {
      normSum += Float.pow(PHI_INV, Float.fromInt(Int.abs(k)));
      k += 1;
    };
    let weight = Float.pow(PHI_INV, Float.fromInt(Int.abs(epoch)));
    let budget = Float.fromInt(Int.abs(COMMUNITY_E8S)) * weight / normSum;
    Int.abs(Float.toInt(budget))
  };

  /// Compute velocity
  func computeVelocity() : Float {
    let circulating = TOTAL_SUPPLY_E8S - totalBurnedTracked - totalLockedTracked;
    if (circulating == 0) { return 0.0 };
    Float.fromInt(Int.abs(txVolumeThisEpoch)) / Float.fromInt(Int.abs(circulating))
  };

  /// Rolling velocity (φ-weighted over last 5 epochs)
  func rollingVelocity() : Float {
    let circulating = TOTAL_SUPPLY_E8S - totalBurnedTracked - totalLockedTracked;
    if (circulating == 0) { return 0.0 };
    var weightedSum : Float = 0.0;
    var weightTotal : Float = 0.0;
    var i : Nat = 0;
    while (i < epochVolumes.size()) {
      let w = Float.pow(PHI_INV, Float.fromInt(Int.abs(i)));
      weightedSum += Float.fromInt(Int.abs(epochVolumes[i])) * w;
      weightTotal += w;
      i += 1;
    };
    if (weightTotal == 0.0) { return 0.0 };
    (weightedSum / weightTotal) / Float.fromInt(Int.abs(circulating))
  };

  /// Velocity health status
  func velocityStatus(v : Float) : Text {
    if (v > PHI_CB) { "CRITICAL_HIGH" }
    else if (v > PHI_SQ) { "WARNING_HIGH" }
    else if (v < 1.0 / PHI_CB) { "CRITICAL_LOW" }
    else if (v < 1.0 / PHI_SQ) { "WARNING_LOW" }
    else { "HEALTHY" }
  };

  /// Fundamental price calculation
  func fundamentalPrice() : Float {
    let circulating = Float.fromInt(Int.abs(TOTAL_SUPPLY_E8S - totalBurnedTracked - totalLockedTracked)) / Float.fromInt(Int.abs(E8S_PER_NOVA));
    if (circulating <= 0.0) { return 0.0 };
    let pvEarnings = steadyEarnings * PHI;
    (treasuryICP + pvEarnings) / circulating
  };

  /// Price deviation assessment
  func priceZone(market : Float, fundamental : Float) : Text {
    if (fundamental <= 0.0) { return "unknown" };
    if (market < fundamental / PHI) { "deeply_oversold" }
    else if (market < fundamental * PHI_INV) { "oversold" }
    else if (market > fundamental * PHI) { "overbought" }
    else { "fair_value" }
  };

  // ══════════════════════════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════════════════════════

  /// Get full economic state report
  public query func getEconomicState() : async EconomicState {
    let v = computeVelocity();
    let fp = fundamentalPrice();
    let circulating = TOTAL_SUPPLY_E8S - totalBurnedTracked - totalLockedTracked;
    let locked = totalLockedTracked;
    let lockRatio : Float = if (circulating + locked == 0) { 0.0 }
      else { Float.fromInt(Int.abs(locked)) / Float.fromInt(Int.abs(circulating + locked)) };

    {
      velocity = v;
      velocityTarget = 1.0;
      velocityStatus = velocityStatus(v);
      circulatingSupply = circulating;
      totalBurned = totalBurnedTracked;
      totalLocked = locked;
      lockupRatio = lockRatio;
      fundamentalPrice = fp;
      marketPrice = lastKnownPrice;
      priceDeviation = if (fp > 0.0) { (lastKnownPrice - fp) / fp } else { 0.0 };
      priceZone = priceZone(lastKnownPrice, fp);
      supportLevel = fp * PHI_INV;
      resistanceLevel = fp * PHI;
      currentEpoch = currentEpoch;
      epochBudget = epochBudget(currentEpoch);
      epochTxCount = txCountThisEpoch;
      lossAversionParam = PHI_SQ;
      discountRate = PHI_INV;
      heartbeatCount = hbtCount;
      timestamp = Time.now();
    }
  };

  /// Simulate an incentive scenario using prospect theory
  public query func simulateIncentive(scenarioName : Text, gain : Float, loss : Float, prob : Float) : async IncentiveSimulation {
    let perceivedGain = prospectValue(gain);
    let perceivedLoss = prospectValue(-loss);
    let netPerceived = perceivedGain + perceivedLoss * prob;
    let requiredReward = if (netPerceived < 0.0) {
      Float.pow(Float.abs(perceivedLoss * prob), 1.0 / PHI_INV)
    } else { gain };

    {
      scenarioName = scenarioName;
      potentialLoss = loss;
      potentialGain = gain;
      perceivedLoss = perceivedLoss;
      perceivedGain = perceivedGain;
      netPerceived = netPerceived;
      isAttractive = netPerceived > 0.0;
      requiredReward = requiredReward;
    }
  };

  /// Calculate optimal fee using Ramsey pricing
  public query func calculateOptimalFee(marginalCost : Float, elasticity : Float) : async Float {
    if (elasticity <= 0.0) { marginalCost * PHI_CB }
    else { marginalCost * (1.0 + 1.0 / (PHI * elasticity)) }
  };

  /// Get velocity metrics
  public query func getVelocityMetrics() : async VelocityMetrics {
    let v = computeVelocity();
    let rv = rollingVelocity();
    let status = velocityStatus(v);
    let rec = if (v > PHI_SQ) { "Consider increasing transfer fees" }
      else if (v < 1.0 / PHI_SQ) { "Consider reducing staking incentives" }
      else { "No action needed" };

    {
      currentVelocity = v;
      rollingVelocity = rv;
      status = status;
      recommendation = rec;
      decomposition = "tx_count=" # Nat.toText(txCountThisEpoch) # " volume_e8s=" # Nat.toText(txVolumeThisEpoch);
    }
  };

  /// Get φ-harmonic price levels
  public query func getPriceLevels() : async PriceLevels {
    let fp = fundamentalPrice();
    {
      fundamental = fp;
      support1 = fp * PHI_INV;
      support2 = fp / PHI_SQ;
      support3 = fp / PHI_CB;
      resistance1 = fp * PHI;
      resistance2 = fp * PHI_SQ;
      resistance3 = fp * PHI_CB;
      fibLevels = [
        ("23.6%", fp * (1.0 - 1.0 / PHI_CB)),
        ("38.2%", fp * (1.0 - 1.0 / PHI_SQ)),
        ("50.0%", fp * 0.5),
        ("61.8%", fp * (1.0 - PHI_INV)),
        ("78.6%", fp * (1.0 - 1.0 / Float.sqrt(PHI)))
      ];
    }
  };

  /// Export all behavioral parameters
  public query func getBehavioralParams() : async BehavioralParams {
    {
      gainSensitivity = PHI_INV;
      lossSensitivity = PHI_INV;
      lossAversion = PHI_SQ;
      probWeightGamma = PHI_INV;
      discountRate = PHI_INV;
      anchorWeight = PHI_INV;
      endowmentMultiplier = PHI_CB;
      herdingExponent = PHI;
      defaultStakeRatio = 1.0 / PHI_CB;
      socialProofThreshold = PHI_INV;
    }
  };

  /// Get current epoch issuance budget
  public query func getEpochBudget() : async Nat {
    epochBudget(currentEpoch)
  };

  /// Record a transaction for velocity tracking (called by nova_token)
  public shared(msg) func recordTransaction(volumeE8s : Nat) : async () {
    txCountThisEpoch += 1;
    txVolumeThisEpoch += volumeE8s;
    totalBurnedTracked += TRANSFER_FEE;  // Each tx burns the fee
  };

  /// Update protocol state (called by admin or governance)
  public shared(msg) func updateState(
    burned : Nat,
    locked : Nat,
    price : Float,
    treasury : Float,
    earnings : Float
  ) : async () {
    totalBurnedTracked := burned;
    totalLockedTracked := locked;
    lastKnownPrice := price;
    treasuryICP := treasury;
    steadyEarnings := earnings;
  };

  /// Advance to next epoch (called by governance or scheduler)
  public shared(msg) func advanceEpoch() : async () {
    // Rotate epoch volumes
    let newVolumes = Array.tabulate<Nat>(5, func(i : Nat) : Nat {
      if (i == 0) { txVolumeThisEpoch }
      else if (i < epochVolumes.size()) { epochVolumes[i - 1] }
      else { 0 }
    });
    epochVolumes := Array.freeze(newVolumes);

    // Reset epoch counters
    txCountThisEpoch := 0;
    txVolumeThisEpoch := 0;
    currentEpoch += 1;
    epochStartTime := Time.now();
  };

  // ══════════════════════════════════════════════════════════════════
  //  HEARTBEAT — Medina Heart Pattern (local math only)
  // ══════════════════════════════════════════════════════════════════

  func _heartbeat() : async () {
    hbtCount += 1;

    // Local-only computation: check velocity thresholds
    let v = computeVelocity();
    // If velocity exceeds critical thresholds, log alert (local only)
    // No inter-canister calls in heartbeat per architectural law
  };

  // Self-starting heart on deploy
  transient let _timerId : Timer.TimerId = Timer.recurringTimer<system>(#seconds 2, _heartbeat);

};
