///
/// @medina/token-economics/managerial
///
/// Re-exports the managerial model from protocols/economics.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

export {
  CYCLE_COSTS, NNC_PREMIUM,
  marginalCostCycles, marginalCostNNC, operationEconomics, ramseyPrice,
  longRunAverageCost, minimumEfficientScale, scaleEconomiesRatio, shouldDeployNewOrganism,
  incentiveCompatibility, agencyCosts, validatorTier,
  crossCanisterTC, localComputeTC, makeVsBuy, heartbeatSavings,
  cycleSourcingDecision,
  governanceOpportunityCost,
} from '../../../protocols/economics/managerial-model.js';
