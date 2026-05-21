/**
 * Type Bridge — TypeScript Client for Julia ↔ Motoko ↔ JavaScript Bridge
 *
 * Provides complete typed access to the type_bridge canister with:
 *   - Full type definitions matching Candid interface
 *   - Async methods for all bridge functions
 *   - Helper utilities for type conversion
 *   - φ constants and utilities
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

// ══════════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════════

/** Golden ratio φ = (1 + √5) / 2 */
export const PHI = 1.6180339887498948482;

/** φ² = φ + 1 */
export const PHI2 = 2.6180339887498948482;

/** φ³ = φ² + φ */
export const PHI3 = 4.23606797749978969;

/** φ⁴ = φ³ + φ² */
export const PHI4 = 6.85410196624968454;

/** 1/φ = φ - 1 */
export const PHI_INV = 0.6180339887498948482;

/** Ancient calendar cycles in milliseconds */
export const MAYAN_CYCLE = 1440.0;
export const SUMERIAN_HOUR = 3600.0;
export const EGYPTIAN_HOUR = 2160.0;
export const LUNAR_CYCLE = 2551.0;
export const SOLAR_CYCLE = 8760.0;
export const PHI_HEARTBEAT = 873.0;

// ══════════════════════════════════════════════════════════════════
//  TYPE DEFINITIONS
// ══════════════════════════════════════════════════════════════════

/** Complex number (Julia: ComplexF64) */
export interface Complex {
  re: number;
  im: number;
}

/** Sparse matrix in CSC format */
export interface SparseMatrix {
  colptr: Uint32Array;
  rowval: Uint32Array;
  nzval: Float64Array;
  m: number;
  n: number;
}

/** φ-weighted value container */
export interface PhiWeighted<T> {
  value: T;
  weight: number; // φ^rank
}

/** 3D coordinate point */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/** Cognitive Internal Language emission */
export interface CILEmission {
  organism_id: string;
  timestamp_ns: bigint;
  thought: string;
  confidence: number;
  phi_weight: number;
  biorhythm: number;
}

/** Eigendecomposition result */
export interface EigenResult {
  values: number[];
  vectors: number[][];
  phi_coherence: number;
}

/** SVD result */
export interface SVDResult {
  U: number[][];
  S: number[];
  Vt: number[][];
  phi_rank: number;
}

/** FFT result */
export interface FFTResult {
  frequencies: number[];
  magnitudes: number[];
  phases: number[];
  phi_peaks: number[];
}

/** Kuramoto synchronization arguments */
export interface KuramotoArgs {
  phases: number[];
  frequencies: number[];
  coupling: number;
  dt: number;
  steps: number;
}

/** Kuramoto synchronization result */
export interface KuramotoResult {
  final_phases: number[];
  order_parameter: number;
  coherence_history: number[];
}

/** Matrix coherence result */
export interface CoherenceResult {
  frobenius_norm: number;
  phi_coherence: number;
  rank_estimate: number;
  condition_number: number;
}

/** Roundtrip validation result */
export interface RoundtripResult {
  success: boolean;
  original_hash: string;
  roundtrip_hash: string;
  error: string | null;
}

/** Type mapping entry */
export interface TypeMapping {
  julia_type: string;
  motoko_type: string;
  javascript_type: string;
  candid_type: string;
  roundtrip_tested: boolean;
  notes: string | null;
}

/** Function card */
export interface FunctionCard {
  name: string;
  category: string;
  purpose: string;
  julia_signature: string;
  motoko_signature: string;
  candid_signature: string;
  typescript_signature: string;
  deterministic: boolean;
  supports_wasm: boolean;
  canister_safe: string;
  compute_location: string;
  numeric_notes: string | null;
  ai_usage: string | null;
}

/** Bridge info */
export interface BridgeInfo {
  name: string;
  version: string;
  languages: string[];
  function_count: number;
  type_mapping_count: number;
}

/** φ constants */
export interface PhiConstants {
  phi: number;
  phi2: number;
  phi3: number;
  phi4: number;
  phi_inv: number;
}

/** Diagnostic info */
export interface DiagInfo {
  status: string;
  health: number;
  name: string;
  timestamp: bigint;
}

// ══════════════════════════════════════════════════════════════════
//  TYPE BRIDGE INTERFACE
// ══════════════════════════════════════════════════════════════════

/**
 * Type Bridge canister interface.
 * Use with @dfinity/agent to call the canister.
 */
export interface TypeBridgeActor {
  // Linear algebra
  phiEigen(matrix: number[][]): Promise<EigenResult>;
  phiSVD(matrix: number[][]): Promise<SVDResult>;
  matrixCoherence(matrix: number[][]): Promise<CoherenceResult>;

  // Signal processing
  phiFFT(signal: number[]): Promise<FFTResult>;

  // Dynamical systems
  kuramotoSync(args: KuramotoArgs): Promise<KuramotoResult>;

  // Temporal / Statistics (query = fast, no state change)
  calculateBiorhythm(timestamp_ms: number): Promise<number>;
  phiWeightedMean(values: number[], ranks: number[]): Promise<number>;

  // Bridge utilities
  validateRoundtrip(encoded: Uint8Array, type_tag: string): Promise<RoundtripResult>;

  // Metadata
  getBridgeInfo(): Promise<BridgeInfo>;
  listTypeMappings(): Promise<TypeMapping[]>;
  getTypeMapping(julia_type: string): Promise<TypeMapping | null>;
  listFunctionCards(): Promise<FunctionCard[]>;
  getFunctionCard(name: string): Promise<FunctionCard | null>;
  getPhiConstants(): Promise<PhiConstants>;

  // Self-reflection
  diag(): Promise<DiagInfo>;
  heal(): Promise<string>;
  register(): Promise<string>;
  report_status(): Promise<string>;
}

// ══════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════

/**
 * Create a PhiWeighted value with the given rank.
 * @param value - The value to wrap
 * @param rank - Priority rank (0-4), determines weight as φ^rank
 */
export function phiWeight<T>(value: T, rank: 0 | 1 | 2 | 3 | 4): PhiWeighted<T> {
  const weights = [1.0, PHI, PHI2, PHI3, PHI4];
  return { value, weight: weights[rank] };
}

/**
 * Calculate biorhythm score locally (matches canister implementation).
 * @param timestamp_ms - Milliseconds since UNIX epoch
 * @returns Normalized biorhythm score (0-1)
 */
export function calculateBiorhythmLocal(timestamp_ms: number): number {
  const TWO_PI = Math.PI * 2;

  // Calculate phase for each ancient cycle
  const mayan_phase = (timestamp_ms % MAYAN_CYCLE) / MAYAN_CYCLE;
  const sumerian_phase = (timestamp_ms % SUMERIAN_HOUR) / SUMERIAN_HOUR;
  const egyptian_phase = (timestamp_ms % EGYPTIAN_HOUR) / EGYPTIAN_HOUR;
  const lunar_phase = (timestamp_ms % LUNAR_CYCLE) / LUNAR_CYCLE;
  const solar_phase = (timestamp_ms % SOLAR_CYCLE) / SOLAR_CYCLE;
  const phi_phase = (timestamp_ms % PHI_HEARTBEAT) / PHI_HEARTBEAT;

  // Convert phases to sine waves
  const mayan_wave = Math.sin(TWO_PI * mayan_phase);
  const sumerian_wave = Math.sin(TWO_PI * sumerian_phase);
  const egyptian_wave = Math.sin(TWO_PI * egyptian_phase);
  const lunar_wave = Math.sin(TWO_PI * lunar_phase);
  const solar_wave = Math.sin(TWO_PI * solar_phase);
  const phi_wave = Math.sin(TWO_PI * phi_phase);

  // Pythagorean combination
  const pythagorean_sum =
    Math.sqrt(
      mayan_wave ** 2 +
        sumerian_wave ** 2 +
        egyptian_wave ** 2 +
        lunar_wave ** 2 +
        solar_wave ** 2 +
        phi_wave ** 2
    ) / Math.sqrt(6);

  // Normalize to [0, 1]
  const normalized = ((pythagorean_sum + 1) / 2) * (PHI / (PHI + 1));

  return Math.max(0, Math.min(1, normalized));
}

/**
 * Calculate φ-weighted mean locally.
 * @param values - Values to average
 * @param ranks - Priority ranks (0-4) for each value
 */
export function phiWeightedMeanLocal(values: number[], ranks: number[]): number {
  if (values.length !== ranks.length || values.length === 0) {
    return 0;
  }

  const weights = [1.0, PHI, PHI2, PHI3, PHI4];
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < values.length; i++) {
    const rank = Math.min(Math.max(0, ranks[i]), 4);
    const weight = weights[rank];
    weightedSum += values[i] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

/**
 * Convert Julia column-major matrix to JavaScript row-major.
 * @param data - Flat array in column-major order
 * @param rows - Number of rows
 * @param cols - Number of columns
 */
export function columnMajorToRowMajor(
  data: number[],
  rows: number,
  cols: number
): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      row.push(data[j * rows + i]);
    }
    result.push(row);
  }
  return result;
}

/**
 * Convert JavaScript row-major matrix to Julia column-major.
 * @param matrix - 2D array in row-major order
 */
export function rowMajorToColumnMajor(matrix: number[][]): number[] {
  const rows = matrix.length;
  const cols = rows > 0 ? matrix[0].length : 0;
  const result: number[] = [];

  for (let j = 0; j < cols; j++) {
    for (let i = 0; i < rows; i++) {
      result.push(matrix[i][j]);
    }
  }
  return result;
}

/**
 * Create a complex number.
 */
export function complex(re: number, im: number = 0): Complex {
  return { re, im };
}

/**
 * Add two complex numbers.
 */
export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

/**
 * Multiply two complex numbers.
 */
export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

/**
 * Complex magnitude.
 */
export function complexAbs(c: Complex): number {
  return Math.sqrt(c.re * c.re + c.im * c.im);
}

/**
 * Complex phase angle.
 */
export function complexArg(c: Complex): number {
  return Math.atan2(c.im, c.re);
}

// ══════════════════════════════════════════════════════════════════
//  TYPE VALIDATION
// ══════════════════════════════════════════════════════════════════

/**
 * Validate that a value can roundtrip through the bridge.
 * @param value - Value to validate
 * @param tolerance - Relative tolerance for float comparison (default 1e-15)
 */
export function validateRoundtripLocal<T>(value: T, tolerance: number = 1e-15): boolean {
  // Simple validation: encode and decode should match
  const json = JSON.stringify(value);
  const decoded = JSON.parse(json) as T;

  return compareValues(value, decoded, tolerance);
}

function compareValues<T>(a: T, b: T, tolerance: number): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    if (!Number.isFinite(a) && !Number.isFinite(b)) return a === b;
    const diff = Math.abs(a - b);
    const mag = Math.max(Math.abs(a), Math.abs(b));
    return diff < tolerance * mag || diff < 1e-300;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => compareValues(v, b[i], tolerance));
  }

  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((k) =>
      compareValues((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], tolerance)
    );
  }

  return a === b;
}

// ══════════════════════════════════════════════════════════════════
//  EXPORT DEFAULT CONSTANTS
// ══════════════════════════════════════════════════════════════════

export default {
  PHI,
  PHI2,
  PHI3,
  PHI4,
  PHI_INV,
  MAYAN_CYCLE,
  SUMERIAN_HOUR,
  EGYPTIAN_HOUR,
  LUNAR_CYCLE,
  SOLAR_CYCLE,
  PHI_HEARTBEAT,
  phiWeight,
  calculateBiorhythmLocal,
  phiWeightedMeanLocal,
  columnMajorToRowMajor,
  rowMajorToColumnMajor,
  complex,
  complexAdd,
  complexMul,
  complexAbs,
  complexArg,
  validateRoundtripLocal,
};
