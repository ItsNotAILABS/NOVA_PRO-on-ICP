///
/// @medina/token-economics/market
///
/// Re-exports the market microstructure engine from protocols/economics.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

export {
  // Constants
  TICK_SIZE, LOT_SIZE, LP_FEE_RATE, CIRCUIT_BREAKERS, MAX_CONCENTRATION,

  // AMM
  computeInvariant, swapOutput, spotPrice, priceImpact,

  // Liquidity
  addLiquidity, removeLiquidity, impermanentLoss, lpReward, lpBreakEvenVolume,

  // Circuit Breakers
  checkCircuitBreaker, computeVolatility,

  // Anti-Manipulation
  detectWashTrade, checkConcentration, requiresCommitReveal,

  // Orderbook
  OrderBook,
} from '../../../protocols/economics/market-microstructure.js';
