///
/// MANAGERIAL MODEL — Cost Curves, Marginal Analysis, Resource Allocation
///
/// This module implements the managerial economics models defined in ME-AEC-2026.
/// It provides cost functions, scale analysis, principal-agent computations,
/// and make-vs-buy decision frameworks for protocol resource allocation.
///
/// Key Models:
///   1. Marginal cost of compute (ICP cycles → NNC pricing)
///   2. Long-run average cost curves (economies of scale)
///   3. Principal-agent incentive compatibility
///   4. Transaction cost analysis (cross-canister vs local)
///   5. Optimal canister deployment decisions
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import { PHI, PHI_INV, PHI_SQ, PHI_CB, PHI_4, FIBONACCI } from './behavioral-engine.js';

// ═══════════════════════════════════════════════════════════════════════════
//  ICP CYCLE COST CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const CYCLE_COSTS = {
  UPDATE_CALL_BASE: 590_000,             // Base cost per update call
  QUERY_CALL: 0,                          // Free (no consensus)
  BYTE_COST_REQUEST: 400,                 // Per byte in request payload
  BYTE_COST_RESPONSE: 400,               // Per byte in response
  CANISTER_CREATION: 100_000_000_000,    // 100B cycles to create canister
  STORAGE_PER_BYTE_SEC: 127_000,         // Storage cost
  COMPUTE_PER_M_INSTRUCTIONS: 400_000,   // Per million instructions
  ASYNC_OVERHEAD: 5_000_000,             // await/callback reservation
  CONSENSUS_COST: 1_200_000,             // Subnet agreement for update
};

// NNC premium multiplier
export const NNC_PREMIUM = PHI_SQ;  // φ² ≈ 2.618

// ═══════════════════════════════════════════════════════════════════════════
//  MARGINAL COST FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the marginal cost of an operation in raw ICP cycles.
 *
 * MC(q) = base_cost + variable_cost × q^(1/φ)
 *
 * @param {number} instructionsMillions - Number of millions of instructions
 * @param {number} payloadBytes - Request + response payload size in bytes
 * @returns {number} Cost in raw ICP cycles
 */
export function marginalCostCycles(instructionsMillions, payloadBytes = 0) {
  const baseCost = CYCLE_COSTS.UPDATE_CALL_BASE +
    payloadBytes * (CYCLE_COSTS.BYTE_COST_REQUEST + CYCLE_COSTS.BYTE_COST_RESPONSE);
  const variableCost = CYCLE_COSTS.COMPUTE_PER_M_INSTRUCTIONS * Math.pow(instructionsMillions, PHI_INV);
  return baseCost + variableCost;
}

/**
 * Compute the NNC-priced cost (with φ² premium).
 *
 * @param {number} instructionsMillions - Millions of instructions
 * @param {number} payloadBytes - Payload size in bytes
 * @returns {number} Cost in Native Nova Cycles
 */
export function marginalCostNNC(instructionsMillions, payloadBytes = 0) {
  return marginalCostCycles(instructionsMillions, payloadBytes) * NNC_PREMIUM;
}

/**
 * Compute the revenue margin per operation.
 *
 * @param {number} instructionsMillions - Millions of instructions
 * @param {number} payloadBytes - Payload size in bytes
 * @returns {{cost: number, price: number, revenue: number, margin: number}}
 */
export function operationEconomics(instructionsMillions, payloadBytes = 0) {
  const cost = marginalCostCycles(instructionsMillions, payloadBytes);
  const price = cost * NNC_PREMIUM;
  const revenue = price - cost;
  const margin = revenue / price; // Should be ≈ 1/φ ≈ 61.8%
  return { cost, price, revenue, margin };
}

/**
 * Ramsey pricing — adjust price based on demand elasticity.
 * Higher markup for inelastic operations, lower for elastic.
 *
 * Price_i = MC_i × (1 + 1/(φ × ε_i))
 *
 * @param {number} marginalCost - MC of the operation
 * @param {number} elasticity - Price elasticity of demand (> 0)
 * @returns {number} Optimal price under Ramsey pricing
 */
export function ramseyPrice(marginalCost, elasticity) {
  if (elasticity <= 0) return marginalCost * PHI_CB; // Perfectly inelastic: max markup
  return marginalCost * (1 + 1 / (PHI * elasticity));
}

// ═══════════════════════════════════════════════════════════════════════════
//  ECONOMIES OF SCALE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Long-Run Average Cost for the protocol given N deployed organisms.
 *
 * LRAC(N) = Fixed_overhead/N + Per_organism_cost × N^(-1/φ)
 *
 * @param {number} N - Number of deployed organisms
 * @param {number} fixedOverhead - Total infrastructure fixed cost (cycles)
 * @param {number} perOrganismCost - Variable cost per organism (cycles)
 * @returns {number} Average cost per organism (cycles)
 */
export function longRunAverageCost(N, fixedOverhead, perOrganismCost) {
  if (N <= 0) return Infinity;
  return fixedOverhead / N + perOrganismCost * Math.pow(N, -PHI_INV);
}

/**
 * Compute the Minimum Efficient Scale — the N at which LRAC is minimized.
 *
 * N_MES = (Fixed / Variable)^φ
 *
 * @param {number} fixedOverhead - Total infrastructure fixed cost
 * @param {number} perOrganismCost - Variable cost per organism
 * @returns {number} Optimal organism count
 */
export function minimumEfficientScale(fixedOverhead, perOrganismCost) {
  if (perOrganismCost <= 0) return 1;
  return Math.pow(fixedOverhead / perOrganismCost, PHI);
}

/**
 * Compute scale economies ratio — how much cheaper at N vs at N=1.
 *
 * @param {number} N - Current organism count
 * @param {number} fixedOverhead - Fixed costs
 * @param {number} perOrganismCost - Variable cost per organism
 * @returns {{lracAtN: number, lracAt1: number, savingsRatio: number}}
 */
export function scaleEconomiesRatio(N, fixedOverhead, perOrganismCost) {
  const lracAtN = longRunAverageCost(N, fixedOverhead, perOrganismCost);
  const lracAt1 = longRunAverageCost(1, fixedOverhead, perOrganismCost);
  return {
    lracAtN,
    lracAt1,
    savingsRatio: 1 - lracAtN / lracAt1,
  };
}

/**
 * Determine if adding a new organism is economically justified.
 *
 * @param {number} currentN - Current organism count
 * @param {number} fixedOverhead - Fixed costs
 * @param {number} perOrganismCost - Per-organism variable cost
 * @param {number} newOrganismValue - Expected value generated by new organism (cycles/epoch)
 * @returns {{justified: boolean, netBenefit: number, newLRAC: number}}
 */
export function shouldDeployNewOrganism(currentN, fixedOverhead, perOrganismCost, newOrganismValue) {
  const currentLRAC = longRunAverageCost(currentN, fixedOverhead, perOrganismCost);
  const newLRAC = longRunAverageCost(currentN + 1, fixedOverhead, perOrganismCost);
  const marginalCostOfAdding = newLRAC * (currentN + 1) - currentLRAC * currentN;
  const netBenefit = newOrganismValue - marginalCostOfAdding;
  return {
    justified: netBenefit > 0,
    netBenefit,
    newLRAC,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  PRINCIPAL-AGENT ECONOMICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute whether honest behavior is incentive-compatible for a validator.
 *
 * Honest: reward = φ% × stake × epochWeight
 * Deviate: gain - P(caught) × slash
 *
 * @param {number} stake - Validator's stake
 * @param {number} epochWeight - Current epoch's weight multiplier
 * @param {number} potentialGain - What the validator could gain by deviating
 * @param {number} probCaught - Probability of being caught [0,1]
 * @returns {{isIncentiveCompatible: boolean, honestReward: number, deviationPayoff: number}}
 */
export function incentiveCompatibility(stake, epochWeight, potentialGain, probCaught) {
  const honestReward = (PHI / 100) * stake * epochWeight; // φ% reward
  const slashAmount = PHI_CB * potentialGain; // φ³ × gain as slash
  const deviationPayoff = potentialGain - probCaught * slashAmount;

  return {
    isIncentiveCompatible: honestReward > deviationPayoff,
    honestReward,
    deviationPayoff,
    margin: honestReward - deviationPayoff,
  };
}

/**
 * Compute total agency costs for the protocol.
 *
 * @param {number} monitoringCost - Cost of on-chain monitoring (cycles/epoch)
 * @param {number} totalBonded - Total validator stake bonded
 * @param {number} residualLossRate - Expected residual loss as fraction of TVL
 * @param {number} tvl - Total Value Locked
 * @returns {{monitoring: number, bonding: number, residualLoss: number, total: number}}
 */
export function agencyCosts(monitoringCost, totalBonded, residualLossRate, tvl) {
  const bonding = totalBonded * (PHI_INV / 100); // Opportunity cost of bonding
  const residualLoss = residualLossRate * tvl;
  return {
    monitoring: monitoringCost,
    bonding,
    residualLoss,
    total: monitoringCost + bonding + residualLoss,
  };
}

/**
 * Determine validator tier based on stake and compute slash parameters.
 *
 * @param {number} stake - Validator's stake in CLAVIS or NOVA equivalent
 * @returns {{tier: number, name: string, slashMultiplier: number, minStake: number}}
 */
export function validatorTier(stake) {
  const tiers = [
    { tier: 4, name: 'Elevated', slashMultiplier: 1.0, minStake: FIBONACCI[12] },  // 987
    { tier: 3, name: 'Trusted', slashMultiplier: PHI, minStake: FIBONACCI[11] },    // 610 (actually Fib(15)=610)
    { tier: 2, name: 'Standard', slashMultiplier: PHI_SQ, minStake: FIBONACCI[10] }, // 377 (Fib(14)=377)
    { tier: 1, name: 'Probation', slashMultiplier: PHI_CB, minStake: FIBONACCI[7] }, // 233 (Fib(13)=233)
  ];

  for (const t of tiers) {
    if (stake >= t.minStake) return t;
  }
  return { tier: 0, name: 'Ineligible', slashMultiplier: Infinity, minStake: 0 };
}

// ═══════════════════════════════════════════════════════════════════════════
//  TRANSACTION COST ANALYSIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the full transaction cost of a cross-canister call.
 *
 * TC = message_cost + async_overhead + consensus_cost
 *
 * @param {number} payloadBytes - Total payload size
 * @returns {number} Transaction cost in cycles
 */
export function crossCanisterTC(payloadBytes = 100) {
  return CYCLE_COSTS.UPDATE_CALL_BASE +
    CYCLE_COSTS.BYTE_COST_REQUEST * payloadBytes +
    CYCLE_COSTS.ASYNC_OVERHEAD +
    CYCLE_COSTS.CONSENSUS_COST;
}

/**
 * Compute the transaction cost of a local computation (same canister).
 *
 * @param {number} instructionsMillions - Millions of instructions
 * @returns {number} Cost in cycles
 */
export function localComputeTC(instructionsMillions) {
  return CYCLE_COSTS.UPDATE_CALL_BASE +
    CYCLE_COSTS.COMPUTE_PER_M_INSTRUCTIONS * instructionsMillions;
}

/**
 * Make-vs-buy decision: should this operation be local or cross-canister?
 *
 * If TC_cross > φ × TC_local: integrate (same canister)
 * If TC_cross < 1/φ × TC_local: outsource (cross-canister)
 * Otherwise: governance decides (hybrid zone)
 *
 * @param {number} localInstructions - Instructions if done locally (millions)
 * @param {number} crossPayloadBytes - Payload if done cross-canister
 * @returns {{decision: string, localCost: number, crossCost: number, ratio: number}}
 */
export function makeVsBuy(localInstructions, crossPayloadBytes) {
  const localCost = localComputeTC(localInstructions);
  const crossCost = crossCanisterTC(crossPayloadBytes);
  const ratio = crossCost / localCost;

  let decision;
  if (ratio > PHI) {
    decision = 'integrate'; // Cross is too expensive
  } else if (ratio < PHI_INV) {
    decision = 'outsource'; // Cross is cheap enough
  } else {
    decision = 'hybrid'; // Governance decides
  }

  return { decision, localCost, crossCost, ratio };
}

/**
 * Compute heartbeat pattern savings — why local-only math saves cycles.
 *
 * @param {number} heartbeatsPerDay - Heartbeats per day (default: 43200 at 2s interval)
 * @param {number} payloadBytes - Hypothetical cross-canister payload
 * @returns {{localCostPerDay: number, crossCostPerDay: number, savingsPerDay: number, savingsRatio: number}}
 */
export function heartbeatSavings(heartbeatsPerDay = 43_200, payloadBytes = 100) {
  const localCostPerBeat = CYCLE_COSTS.UPDATE_CALL_BASE; // Pure local math
  const crossCostPerBeat = crossCanisterTC(payloadBytes);

  const localCostPerDay = localCostPerBeat * heartbeatsPerDay;
  const crossCostPerDay = crossCostPerBeat * heartbeatsPerDay;

  return {
    localCostPerDay,
    crossCostPerDay,
    savingsPerDay: crossCostPerDay - localCostPerDay,
    savingsRatio: 1 - localCostPerDay / crossCostPerDay,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  CYCLE SOURCING DECISION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compare raw ICP cycles vs Native Nova Cycles for a given workload.
 *
 * @param {number} cyclesNeeded - Raw cycles needed for the workload
 * @param {number} governanceValue - Estimated value of governance participation
 * @param {number} aiManagementValue - Estimated value of DIVI AI management
 * @param {number} auditValue - Estimated value of audit trail
 * @returns {{recommendation: string, rawCost: number, nncCost: number, valueAdd: number, netBenefit: number}}
 */
export function cycleSourcingDecision(cyclesNeeded, governanceValue = 0, aiManagementValue = 0, auditValue = 0) {
  const rawCost = cyclesNeeded; // 1:1 raw cost
  const nncCost = cyclesNeeded * NNC_PREMIUM; // φ² premium
  const premiumPaid = nncCost - rawCost;
  const valueAdd = governanceValue + aiManagementValue + auditValue;
  const netBenefit = valueAdd - premiumPaid;

  return {
    recommendation: netBenefit > 0 ? 'NNC' : 'raw_ICP',
    rawCost,
    nncCost,
    premiumPaid,
    valueAdd,
    netBenefit,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  OPPORTUNITY COST OF GOVERNANCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the expected value of voting vs not voting for a token holder.
 *
 * @param {number} stake - Holder's stake
 * @param {number} totalVotingStake - Total protocol-wide voting stake
 * @param {number} epochBudget - Total rewards available this epoch
 * @param {number} timeCostHours - Time spent voting (hours)
 * @param {number} hourlyWage - Opportunity cost per hour (in NOVA equivalent)
 * @returns {{evVote: number, evNoVote: number, shouldVote: boolean, breakEvenStake: number}}
 */
export function governanceOpportunityCost(stake, totalVotingStake, epochBudget, timeCostHours, hourlyWage) {
  const reward = epochBudget * (stake / totalVotingStake);
  const participationBonus = reward * PHI_INV; // Bonus for active participation
  const timeCost = timeCostHours * hourlyWage;
  const reputationDecay = stake * (1 / PHI) * 0.01; // 1/φ% reputation loss per missed epoch

  const evVote = reward + participationBonus - timeCost;
  const evNoVote = -reputationDecay;
  const shouldVote = evVote > evNoVote;

  // Break-even: reward + bonus = timeCost → stake = timeCost × totalVotingStake / (epochBudget × (1+PHI_INV))
  const breakEvenStake = timeCost * totalVotingStake / (epochBudget * (1 + PHI_INV));

  return { evVote, evNoVote, shouldVote, breakEvenStake };
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default {
  CYCLE_COSTS, NNC_PREMIUM,
  marginalCostCycles, marginalCostNNC, operationEconomics, ramseyPrice,
  longRunAverageCost, minimumEfficientScale, scaleEconomiesRatio, shouldDeployNewOrganism,
  incentiveCompatibility, agencyCosts, validatorTier,
  crossCanisterTC, localComputeTC, makeVsBuy, heartbeatSavings,
  cycleSourcingDecision,
  governanceOpportunityCost,
};
