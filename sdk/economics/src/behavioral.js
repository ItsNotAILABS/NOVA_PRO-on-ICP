///
/// @medina/token-economics/behavioral
///
/// Re-exports the behavioral engine from protocols/economics.
/// This is the SDK interface for external builders.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

export {
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
} from '../../../protocols/economics/behavioral-engine.js';
