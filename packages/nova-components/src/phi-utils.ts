/**
 * @nova-protocol/nova-components
 *
 * φ-Mathematics utilities for Lit Web Components.
 * Golden-ratio positioning, Fibonacci thresholds, phyllotaxis layouts.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

// ─── Constants ───────────────────────────────────────────────────────────────

/** Golden ratio: φ = (1 + √5) / 2 */
export const PHI = 1.6180339887498948482;

/** φ² */
export const PHI2 = PHI * PHI;

/** φ³ */
export const PHI3 = PHI2 * PHI;

/** 1/φ = φ − 1 */
export const PHI_INV = 1 / PHI;

/** Golden angle in degrees: 360° × (2 − φ) ≈ 137.50776° */
export const GOLDEN_ANGLE_DEG = 360 * (2 - PHI);

/** Golden angle in radians */
export const GOLDEN_ANGLE_RAD = GOLDEN_ANGLE_DEG * (Math.PI / 180);

// ─── Fibonacci Sequence ──────────────────────────────────────────────────────

const fibCache = new Map<number, number>([[0, 0], [1, 1]]);

/** Returns the n-th Fibonacci number (0-indexed) */
export function fib(n: number): number {
  if (n < 0) throw new RangeError(`fib(${n}): n must be >= 0`);
  if (fibCache.has(n)) return fibCache.get(n)!;
  const result = fib(n - 1) + fib(n - 2);
  fibCache.set(n, result);
  return result;
}

/** Returns the first `count` Fibonacci numbers starting at fib(start) */
export function fibSequence(count: number, start = 0): number[] {
  return Array.from({ length: count }, (_, i) => fib(start + i));
}

/** Returns the nearest Fibonacci number >= n */
export function nearestFib(n: number): number {
  if (n <= 0) return 0;
  let a = 0, b = 1;
  while (b < n) { const t = a + b; a = b; b = t; }
  return b;
}

// ─── Phyllotaxis (Golden-Spiral Layout) ──────────────────────────────────────

export interface PhyllotaxisCoord {
  r: number;
  thetaRad: number;
  thetaDeg: number;
}

export interface CartesianCoord {
  x: number;
  y: number;
}

/**
 * Returns the polar coordinates for the n-th element in a golden-angle spiral.
 */
export function phyllotaxisCoord(n: number): PhyllotaxisCoord {
  return {
    r: Math.sqrt(n),
    thetaRad: n * GOLDEN_ANGLE_RAD,
    thetaDeg: n * GOLDEN_ANGLE_DEG,
  };
}

/**
 * Returns the Cartesian (x, y) position on a phyllotaxis spiral for element n.
 */
export function phyllotaxisXY(n: number, scale = 1): CartesianCoord {
  const { r, thetaRad } = phyllotaxisCoord(n);
  return {
    x: r * Math.cos(thetaRad) * scale,
    y: r * Math.sin(thetaRad) * scale,
  };
}

/**
 * Generates layout positions for N items using golden-spiral phyllotaxis.
 * Returns array of {x, y} coordinates centered around (centerX, centerY).
 */
export function goldenSpiralLayout(
  count: number,
  centerX: number,
  centerY: number,
  scale = 20,
): CartesianCoord[] {
  return Array.from({ length: count }, (_, i) => {
    const { x, y } = phyllotaxisXY(i, scale);
    return { x: x + centerX, y: y + centerY };
  });
}

// ─── φ-Weight Functions ──────────────────────────────────────────────────────

/** φ-weight for the n-th item in a ranked list (n >= 1) */
export function phiWeight(n: number): number {
  return (n * PHI) % 10;
}

/** φ-weight based on depth (attenuates by φ^(-depth)) */
export function phiWeightDepth(value: number, depth: number): number {
  return value * Math.pow(PHI, -depth);
}

// ─── Element Class Mapping ───────────────────────────────────────────────────

export type ElementClass = 'gold' | 'silver' | 'crimson';

export interface ElementColors {
  primary: string;
  secondary: string;
  glow: string;
}

export const ELEMENT_COLORS: Record<ElementClass, ElementColors> = {
  gold: {
    primary: '#c9a84c',
    secondary: '#e2c06e',
    glow: 'rgba(201, 168, 76, 0.3)',
  },
  silver: {
    primary: '#94a3b8',
    secondary: '#cbd5e1',
    glow: 'rgba(148, 163, 184, 0.3)',
  },
  crimson: {
    primary: '#dc2626',
    secondary: '#f87171',
    glow: 'rgba(220, 38, 38, 0.3)',
  },
};

/** Get element class based on canister role */
export function getElementClass(role: string): ElementClass {
  switch (role.toLowerCase()) {
    case 'immutable-state':
    case 'store':
    case 'vault':
      return 'gold';
    case 'conductor':
    case 'relay':
    case 'mirror':
      return 'silver';
    case 'organism':
    case 'generative':
    case 'living':
    default:
      return 'crimson';
  }
}

// ─── CSS Custom Properties Generator ─────────────────────────────────────────

/**
 * Generates CSS custom properties for φ-mathematics.
 */
export function generatePhiCSSVars(): string {
  return `
    --phi: ${PHI};
    --phi-inv: ${PHI_INV};
    --phi-2: ${PHI2};
    --phi-3: ${PHI3};
    --golden-angle-deg: ${GOLDEN_ANGLE_DEG}deg;
    --golden-angle-rad: ${GOLDEN_ANGLE_RAD}rad;

    /* φ-spacing scale */
    --phi-space-0: 0.618rem;
    --phi-space-1: 1rem;
    --phi-space-2: 1.618rem;
    --phi-space-3: 2.618rem;
    --phi-space-4: 4.236rem;
    --phi-space-5: 6.854rem;

    /* Fibonacci spacing */
    --fib-space-3: 0.25rem;
    --fib-space-5: 0.625rem;
    --fib-space-8: 1rem;
    --fib-space-13: 1.625rem;
    --fib-space-21: 2.625rem;
    --fib-space-34: 4.25rem;

    /* Timing */
    --fib-duration-55: 55ms;
    --fib-duration-89: 89ms;
    --fib-duration-144: 144ms;
    --fib-duration-233: 233ms;
    --fib-duration-377: 377ms;
    --phi-duration: 1618ms;
  `;
}
