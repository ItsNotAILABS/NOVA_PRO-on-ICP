/**
 * @nova-protocol/nova-components
 *
 * Lit Web Components for the NOVA Platform with φ-mathematics layouts.
 * Golden-spiral positioning, Fibonacci thresholds, sovereign element styling.
 *
 * Components:
 *   - <nova-canister-card>: Canister status card
 *   - <nova-organism-grid>: Golden-spiral layout container
 *   - <nova-health-gauge>: Circular health indicator
 *   - <nova-connection-line>: Organism connection visualizer
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

// φ-Mathematics utilities
export {
  PHI,
  PHI2,
  PHI3,
  PHI_INV,
  GOLDEN_ANGLE_DEG,
  GOLDEN_ANGLE_RAD,
  fib,
  fibSequence,
  nearestFib,
  phyllotaxisCoord,
  phyllotaxisXY,
  goldenSpiralLayout,
  phiWeight,
  phiWeightDepth,
  getElementClass,
  generatePhiCSSVars,
  ELEMENT_COLORS,
  type PhyllotaxisCoord,
  type CartesianCoord,
  type ElementClass,
  type ElementColors,
} from './phi-utils.js';

// Web Components
export { NovaCanisterCard } from './elements/nova-canister-card.js';
export { NovaOrganismGrid } from './elements/nova-organism-grid.js';
export { NovaHealthGauge } from './elements/nova-health-gauge.js';
export { NovaConnectionLine } from './elements/nova-connection-line.js';
