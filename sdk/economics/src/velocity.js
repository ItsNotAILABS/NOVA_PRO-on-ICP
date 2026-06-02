///
/// @medina/token-economics/velocity
///
/// Re-exports the token velocity engine from protocols/economics.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

export {
  TOTAL_SUPPLY_E8S, TREASURY_E8S, COMMUNITY_E8S, FOUNDER_E8S, E8S_PER_NOVA, TRANSFER_FEE_E8S,
  computeVelocity, rollingVelocity, velocityHealth, velocityDecomposition,
  sourceRate, epochIssuanceBudget, sinkRate, netSupplyChange, supplyHalfLife,
  fundamentalPrice, phiPriceLevels, priceDeviation, meanReversionForecast,
  fibonacciRetracement, epochPriceBand,
  phiRandom, logNormalVariate, simulateEpoch, monteCarloSimulation,
  economicHealthReport,
} from '../../../protocols/economics/token-velocity.js';
