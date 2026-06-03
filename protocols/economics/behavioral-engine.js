///
/// BEHAVIORAL ENGINE — Prospect Theory, Hyperbolic Discounting, Nudge Calculus
///
/// This module implements the behavioral economics models defined in BE-AEC-2026.
/// It provides utility functions for computing agent decision parameters,
/// framing effects, and nudge recommendations.
///
/// Key Models:
///   1. Prospect Theory value function (Kahneman-Tversky with φ parameters)
///   2. Hyperbolic discounting for vesting period design
///   3. Probability weighting (Prelec function with φ calibration)
///   4. Nudge score calculator for protocol UX decisions
///   5. Herding index computation for validator selection
///
/// All parameters are φ-grounded per BE-AEC-2026 specification.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

// ═══════════════════════════════════════════════════════════════════════════
//  φ CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

export const PHI = 1.6180339887498948482;
export const PHI_INV = 0.6180339887498948482;   // 1/φ
export const PHI_SQ = 2.6180339887498948482;    // φ²
export const PHI_CB = 4.2360679774997896964;    // φ³
export const PHI_4 = 6.8541019662496845446;     // φ⁴

// Fibonacci sequence (first 13 terms)
export const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

// ═══════════════════════════════════════════════════════════════════════════
//  BEHAVIORAL PARAMETERS (from BE-AEC-2026)
// ═══════════════════════════════════════════════════════════════════════════

export const BEHAVIORAL_PARAMS = {
  // Prospect Theory
  GAIN_SENSITIVITY: PHI_INV,        // α = 1/φ ≈ 0.618
  LOSS_SENSITIVITY: PHI_INV,        // β = 1/φ ≈ 0.618
  LOSS_AVERSION: PHI_SQ,            // λ = φ² ≈ 2.618

  // Probability Weighting
  PROB_WEIGHT_GAMMA: PHI_INV,       // γ = 1/φ ≈ 0.618

  // Hyperbolic Discounting
  DISCOUNT_RATE: PHI_INV,           // k = 1/φ ≈ 0.618

  // Anchoring
  ANCHOR_WEIGHT: PHI_INV,           // w = 1/φ ≈ 0.618

  // Endowment Effect
  ENDOWMENT_MULTIPLIER: PHI_CB,     // ε = φ³ ≈ 4.236

  // Herding
  HERDING_EXPONENT: PHI,            // h = φ ≈ 1.618

  // Nudge Defaults
  DEFAULT_STAKE_RATIO: 1 / PHI_CB,  // 1/φ³ ≈ 23.6% auto-stake
  SOCIAL_PROOF_THRESHOLD: PHI_INV,  // 1/φ ≈ 61.8% triggers social proof
};

// ═══════════════════════════════════════════════════════════════════════════
//  PROSPECT THEORY VALUE FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the subjective value of a gain or loss using Prospect Theory.
 *
 * v(x) = x^α              if x ≥ 0 (gains)
 * v(x) = -λ × (-x)^β     if x < 0 (losses)
 *
 * @param {number} x - The objective gain (+) or loss (-) in NOVA e8s
 * @returns {number} Subjective perceived value
 */
export function prospectValue(x) {
  const { GAIN_SENSITIVITY: alpha, LOSS_SENSITIVITY: beta, LOSS_AVERSION: lambda } = BEHAVIORAL_PARAMS;

  if (x >= 0) {
    return Math.pow(x, alpha);
  } else {
    return -lambda * Math.pow(-x, beta);
  }
}

/**
 * Compute the ratio of perceived loss to perceived gain for equal amounts.
 * This quantifies how much more a loss hurts relative to an equivalent gain.
 *
 * @param {number} amount - The amount (positive)
 * @returns {number} Loss/gain ratio (should be ≈ φ² = 2.618 for equal amounts)
 */
export function lossGainRatio(amount) {
  const gain = prospectValue(amount);
  const loss = prospectValue(-amount);
  return Math.abs(loss) / gain;
}

/**
 * Determine the minimum reward needed to motivate an agent to accept a given risk.
 * Based on: reward must exceed λ × perceived_risk to trigger participation.
 *
 * @param {number} potentialLoss - Maximum loss in worst case (positive number)
 * @param {number} probabilityOfLoss - Probability of the loss occurring [0,1]
 * @returns {number} Minimum reward to motivate participation
 */
export function minimumMotivatingReward(potentialLoss, probabilityOfLoss) {
  const weightedProb = probabilityWeight(probabilityOfLoss);
  const perceivedRisk = Math.abs(prospectValue(-potentialLoss)) * weightedProb;
  // Agent needs reward whose prospect value exceeds perceived risk
  // v(reward) > perceivedRisk → reward > perceivedRisk^(1/α)
  return Math.pow(perceivedRisk, 1 / BEHAVIORAL_PARAMS.GAIN_SENSITIVITY);
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROBABILITY WEIGHTING (Prelec Function)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Probability weighting function (Prelec, φ-calibrated).
 * Models how agents distort probabilities — overweighting small p, underweighting large p.
 *
 * π(p) = p^γ / (p^γ + (1-p)^γ)^(1/γ)
 *
 * @param {number} p - Objective probability [0,1]
 * @returns {number} Subjective decision weight [0,1]
 */
export function probabilityWeight(p) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;

  const gamma = BEHAVIORAL_PARAMS.PROB_WEIGHT_GAMMA;
  const pGamma = Math.pow(p, gamma);
  const oneMinusPGamma = Math.pow(1 - p, gamma);
  return pGamma / Math.pow(pGamma + oneMinusPGamma, 1 / gamma);
}

// ═══════════════════════════════════════════════════════════════════════════
//  HYPERBOLIC DISCOUNTING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Hyperbolic discount factor for a future reward.
 *
 * D(t) = 1 / (1 + k × t)
 *
 * @param {number} t - Time in weeks until reward
 * @returns {number} Discount factor [0,1] (1 = no discount, 0 = fully discounted)
 */
export function hyperbolicDiscount(t) {
  return 1 / (1 + BEHAVIORAL_PARAMS.DISCOUNT_RATE * t);
}

/**
 * Compute perceived value of a future reward accounting for hyperbolic discounting.
 *
 * @param {number} actualValue - Objective value at time t
 * @param {number} weeksDelay - Weeks until value is received
 * @returns {number} Perceived present value
 */
export function perceivedFutureValue(actualValue, weeksDelay) {
  return actualValue * hyperbolicDiscount(weeksDelay);
}

/**
 * Compute the required APY to make a lockup attractive given hyperbolic discounting.
 * The reward must compensate for the perceived loss of liquidity.
 *
 * @param {number} baseAPY - Baseline APY for shortest lockup
 * @param {number} lockupWeeks - Duration of lockup in weeks
 * @returns {number} Required APY multiplier for this lockup to be attractive
 */
export function requiredAPYMultiplier(baseAPY, lockupWeeks) {
  // Discount factor tells us what fraction of value the agent perceives
  const discount = hyperbolicDiscount(lockupWeeks);
  // To compensate: actual_reward × discount ≈ baseAPY
  // So: actual_reward = baseAPY / discount
  return 1 / discount;
}

/**
 * Compute Fibonacci dissolve period rewards using φ-escalation.
 *
 * @param {number} baseReward - Reward for the shortest (1-week) lockup
 * @returns {Array<{weeks: number, reward: number, perceivedValue: number}>}
 */
export function fibonacciLockupRewards(baseReward) {
  const lockupWeeks = [1, 1, 2, 3, 5, 8, 13, 21];
  return lockupWeeks.map((weeks, index) => {
    const reward = baseReward * Math.pow(PHI, index / PHI);
    const perceived = perceivedFutureValue(reward, weeks);
    return { weeks, reward, perceivedValue: perceived };
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  ANCHORING MODEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Model the anchoring effect on a voter's final position.
 *
 * final = anchor × w + independent × (1 - w)
 *
 * @param {number} anchorValue - The first-mover's stated value/vote
 * @param {number} independentAssessment - The voter's own analysis
 * @returns {number} Expected final vote position (anchored)
 */
export function anchoredVote(anchorValue, independentAssessment) {
  const w = BEHAVIORAL_PARAMS.ANCHOR_WEIGHT;
  return anchorValue * w + independentAssessment * (1 - w);
}

/**
 * Compute time-weighted vote power to mitigate anchoring.
 * Early votes (first 1/φ³) get reduced weight, late votes get bonus.
 *
 * @param {number} voteTimestamp - When the vote was cast
 * @param {number} periodStart - When voting opened
 * @param {number} periodEnd - When voting closes
 * @returns {number} Weight multiplier for this vote (< 1 for early, > 1 for late)
 */
export function anchorDilutionWeight(voteTimestamp, periodStart, periodEnd) {
  const duration = periodEnd - periodStart;
  const elapsed = voteTimestamp - periodStart;
  const fraction = elapsed / duration;

  if (fraction < 1 / PHI_CB) {
    // Early votes: weighted at 1/φ
    return PHI_INV;
  } else if (fraction > PHI_INV) {
    // Late votes: weighted at φ
    return PHI;
  }
  // Middle votes: standard weight
  return 1.0;
}

// ═══════════════════════════════════════════════════════════════════════════
//  ENDOWMENT EFFECT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the deterrence power of a penalty on a soulbound (SSN) asset.
 * Soulbound assets have amplified endowment effect (cannot be sold → infinite WTA).
 *
 * @param {number} penaltyAmount - Objective penalty amount
 * @param {boolean} isSoulbound - Whether the penalized asset is soulbound
 * @returns {number} Perceived deterrence value (always > penaltyAmount)
 */
export function deterrencePower(penaltyAmount, isSoulbound = false) {
  const lossPerception = Math.abs(prospectValue(-penaltyAmount));
  if (isSoulbound) {
    return lossPerception * BEHAVIORAL_PARAMS.ENDOWMENT_MULTIPLIER;
  }
  return lossPerception;
}

/**
 * Rank penalty types by deterrence effectiveness.
 *
 * @param {number} basePenalty - Base penalty amount
 * @returns {Array<{type: string, deterrence: number, multiplier: number}>}
 */
export function penaltyDeterrenceRanking(basePenalty) {
  const { LOSS_AVERSION: lambda, ENDOWMENT_MULTIPLIER: epsilon } = BEHAVIORAL_PARAMS;
  return [
    { type: 'SSN_revocation', deterrence: basePenalty * epsilon * lambda, multiplier: epsilon * lambda },
    { type: 'Stake_slash', deterrence: basePenalty * lambda, multiplier: lambda },
    { type: 'Reputation_reduction', deterrence: basePenalty * PHI, multiplier: PHI },
    { type: 'Monetary_fine', deterrence: basePenalty * 1.0, multiplier: 1.0 },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
//  HERDING AND SOCIAL PROOF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute the herding probability — likelihood an agent selects a given validator.
 * Uses superlinear preference (exponent φ > 1).
 *
 * P(i) = stake_i^φ / Σ(stake_j^φ)
 *
 * @param {number} validatorStake - Stake of the target validator
 * @param {number[]} allStakes - Array of all validator stakes
 * @returns {number} Probability of selection [0,1]
 */
export function herdingProbability(validatorStake, allStakes) {
  const h = BEHAVIORAL_PARAMS.HERDING_EXPONENT;
  const targetPower = Math.pow(validatorStake, h);
  const totalPower = allStakes.reduce((sum, s) => sum + Math.pow(s, h), 0);
  return totalPower > 0 ? targetPower / totalPower : 0;
}

/**
 * Compute the Herfindahl-Hirschman Index (HHI) adjusted for herding.
 * HHI = Σ(share_i²) — measures market concentration.
 *
 * @param {number[]} stakes - Array of all validator stakes
 * @returns {number} HHI ∈ [0,1] — 0 = perfect distribution, 1 = monopoly
 */
export function herdingIndex(stakes) {
  const total = stakes.reduce((sum, s) => sum + s, 0);
  if (total === 0) return 0;
  return stakes.reduce((hhi, s) => hhi + Math.pow(s / total, 2), 0);
}

/**
 * Compute anti-herding diversity bonus for selecting a lower-ranked validator.
 *
 * @param {number} rank - Rank of selected validator (1 = largest, N = smallest)
 * @param {number} baseReward - Base staking reward
 * @returns {number} Diversity bonus amount
 */
export function diversityBonus(rank, baseReward) {
  return baseReward * Math.pow(PHI, -rank);
}

/**
 * Check if a validator exceeds the φ-cap on concentration.
 *
 * @param {number} validatorStake - Individual validator stake
 * @param {number} totalStake - Total protocol stake
 * @returns {{exceeded: boolean, excess: number, maxAllowed: number}}
 */
export function concentrationCheck(validatorStake, totalStake) {
  const maxShare = totalStake / PHI_SQ; // 1/φ² ≈ 38.2%
  const exceeded = validatorStake > maxShare;
  return {
    exceeded,
    excess: exceeded ? validatorStake - maxShare : 0,
    maxAllowed: maxShare,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  NUDGE SCORING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute a nudge effectiveness score for a given framing strategy.
 *
 * @param {object} params
 * @param {boolean} params.isLossFramed - Whether the message uses loss framing
 * @param {boolean} params.hasSocialProof - Whether peer comparison is shown
 * @param {boolean} params.isDefault - Whether this is the default option
 * @param {boolean} params.hasScarcity - Whether temporal urgency is emphasized
 * @returns {number} Nudge effectiveness score [0, φ²]
 */
export function nudgeScore({ isLossFramed = false, hasSocialProof = false, isDefault = false, hasScarcity = false }) {
  let score = 1.0;

  if (isLossFramed) score *= BEHAVIORAL_PARAMS.LOSS_AVERSION; // φ² boost
  if (hasSocialProof) score *= PHI;                            // φ boost
  if (isDefault) score *= PHI;                                 // φ boost (default effect)
  if (hasScarcity) score *= PHI_INV + 1;                       // moderate boost

  return Math.min(score, PHI_SQ * PHI); // cap at φ³
}

/**
 * Generate recommended framing for a staking decision.
 *
 * @param {number} amount - Amount being staked
 * @param {number} lockWeeks - Lockup duration in weeks
 * @param {number} expectedReward - Expected reward over period
 * @returns {object} Framing recommendations
 */
export function stakingFrameRecommendation(amount, lockWeeks, expectedReward) {
  const perceivedReward = perceivedFutureValue(expectedReward, lockWeeks);
  const perceivedLossOfLiquidity = Math.abs(prospectValue(-amount * (1 - hyperbolicDiscount(lockWeeks))));
  const netPerceivedValue = perceivedReward - perceivedLossOfLiquidity;

  return {
    amount,
    lockWeeks,
    expectedReward,
    perceivedReward,
    perceivedLossOfLiquidity,
    netPerceivedValue,
    isAttractive: netPerceivedValue > 0,
    requiredRewardForAttractiveness: netPerceivedValue < 0
      ? expectedReward + Math.pow(Math.abs(netPerceivedValue), 1 / BEHAVIORAL_PARAMS.GAIN_SENSITIVITY)
      : expectedReward,
    recommendedFraming: netPerceivedValue > 0
      ? `Earn ${(expectedReward / amount * 100).toFixed(1)}% over ${lockWeeks} weeks (${PHI.toFixed(2)}× your current rate)`
      : `Locking now prevents losing ${(perceivedLossOfLiquidity / amount * 100).toFixed(1)}% in opportunity cost`,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

export default {
  // Constants
  PHI, PHI_INV, PHI_SQ, PHI_CB, PHI_4,
  FIBONACCI, BEHAVIORAL_PARAMS,

  // Prospect Theory
  prospectValue, lossGainRatio, minimumMotivatingReward,

  // Probability Weighting
  probabilityWeight,

  // Hyperbolic Discounting
  hyperbolicDiscount, perceivedFutureValue,
  requiredAPYMultiplier, fibonacciLockupRewards,

  // Anchoring
  anchoredVote, anchorDilutionWeight,

  // Endowment Effect
  deterrencePower, penaltyDeterrenceRanking,

  // Herding
  herdingProbability, herdingIndex, diversityBonus, concentrationCheck,

  // Nudge
  nudgeScore, stakingFrameRecommendation,
};
