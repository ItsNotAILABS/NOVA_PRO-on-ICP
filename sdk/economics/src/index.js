///
/// @medina/token-economics — Unified SDK Entry Point
///
/// The complete token economics toolkit for the Native Nova Protocol.
/// Provides behavioral economics, managerial analysis, token velocity tracking,
/// and market microstructure — all grounded in φ (golden ratio) mathematics.
///
/// Usage:
///   import { behavioral, managerial, velocity, market } from '@medina/token-economics';
///
///   // Prospect theory value of a gain
///   const perceived = behavioral.prospectValue(100);
///
///   // Marginal cost of compute
///   const cost = managerial.marginalCostNNC(1.5);
///
///   // Velocity health check
///   const health = velocity.velocityHealth(currentV);
///
///   // AMM swap output
///   const output = market.swapOutput(1000, reserveIn, reserveOut);
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

export * as behavioral from './behavioral.js';
export * as managerial from './managerial.js';
export * as velocity from './velocity.js';
export * as market from './market.js';

// Re-export constants at top level for convenience
export { PHI, PHI_INV, PHI_SQ, PHI_CB, PHI_4, FIBONACCI, BEHAVIORAL_PARAMS } from './behavioral.js';
