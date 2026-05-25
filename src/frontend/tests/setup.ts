/**
 * Vitest Test Setup — φ-Mathematics Testing Utilities
 *
 * Global setup for all tests including:
 * - Testing Library configuration
 * - φ-weighted test priority helpers
 * - Fibonacci mock delays
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// ─── φ-Mathematics Constants ─────────────────────────────────────────────────

export const PHI = 1.6180339887498948482;
export const PHI_INV = 0.6180339887498948;

/** Fibonacci sequence for test utilities */
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);

export function fib(n: number): number {
  if (n < 0) throw new RangeError(`fib(${n}): n must be >= 0`);
  if (fibCache.has(n)) return fibCache.get(n)!;
  const result = fib(n - 1) + fib(n - 2);
  fibCache.set(n, result);
  return result;
}

/** Fibonacci delay values in milliseconds */
export const FIB_DELAYS = {
  F3: fib(3),    // 2ms
  F4: fib(4),    // 3ms
  F5: fib(5),    // 5ms
  F6: fib(6),    // 8ms
  F7: fib(7),    // 13ms
  F8: fib(8),    // 21ms
  F9: fib(9),    // 34ms
  F10: fib(10),  // 55ms
};

// ─── Global Test Setup ───────────────────────────────────────────────────────

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─── φ-Weighted Test Priority ────────────────────────────────────────────────

export type TestRiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface TestPriorityConfig {
  riskLevel: TestRiskLevel;
  complexity: number;  // 1-10
  coverage: number;    // 0-1 (percentage of code covered)
}

/**
 * Calculate test priority using φ-weighting.
 * Higher priority = should run first.
 *
 * priority = complexity × phiWeight(riskLevel)
 */
export function calculateTestPriority(config: TestPriorityConfig): number {
  const riskWeights: Record<TestRiskLevel, number> = {
    critical: 4,  // φ⁴ ≈ 6.85
    high: 3,      // φ³ ≈ 4.24
    medium: 2,    // φ² ≈ 2.62
    low: 1,       // φ¹ ≈ 1.62
  };

  const riskExponent = riskWeights[config.riskLevel];
  const phiWeight = Math.pow(PHI, riskExponent);

  // Factor in complexity and coverage gap
  const coverageGap = 1 - config.coverage;
  const priority = config.complexity * phiWeight * (1 + coverageGap);

  return priority;
}

/**
 * Sort test suites by φ-weighted priority.
 */
export function sortTestsByPriority<T extends { priority: number }>(tests: T[]): T[] {
  return [...tests].sort((a, b) => b.priority - a.priority);
}

// ─── Fibonacci Mock Delays ───────────────────────────────────────────────────

/**
 * Create a mock function that resolves after a Fibonacci delay.
 * Useful for simulating canister response times.
 */
export function createFibDelayMock<T>(
  response: T,
  fibLevel: keyof typeof FIB_DELAYS = 'F5',
): () => Promise<T> {
  return () => new Promise((resolve) => {
    setTimeout(() => resolve(response), FIB_DELAYS[fibLevel]);
  });
}

/**
 * Wait for a Fibonacci-based delay.
 */
export function fibDelay(fibLevel: keyof typeof FIB_DELAYS = 'F5'): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, FIB_DELAYS[fibLevel]);
  });
}

// ─── Mock Canister State ─────────────────────────────────────────────────────

export interface MockCanisterState {
  id: string;
  name: string;
  status: 'dormant' | 'initializing' | 'active' | 'migrating' | 'evolved' | 'error';
  elementClass: 'gold' | 'silver' | 'crimson';
  cycleBalance: number;
  memoryUsed: number;
}

/**
 * Create mock canister state for testing.
 */
export function createMockCanister(overrides: Partial<MockCanisterState> = {}): MockCanisterState {
  return {
    id: `canister-${Math.random().toString(36).slice(2, 9)}`,
    name: 'Test Canister',
    status: 'active',
    elementClass: 'silver',
    cycleBalance: 1_000_000_000,
    memoryUsed: 100_000_000,
    ...overrides,
  };
}

/**
 * Create multiple mock canisters with Fibonacci-distributed properties.
 */
export function createMockCanisterSet(count: number): MockCanisterState[] {
  const elementClasses: Array<'gold' | 'silver' | 'crimson'> = ['gold', 'silver', 'crimson'];

  return Array.from({ length: count }, (_, i) => ({
    id: `canister-${i}`,
    name: `Canister ${i}`,
    status: 'active' as const,
    elementClass: elementClasses[i % 3],
    cycleBalance: fib(10 + (i % 5)) * 1_000_000,  // Fibonacci-based cycles
    memoryUsed: fib(8 + (i % 4)) * 1_000_000,     // Fibonacci-based memory
  }));
}

// ─── Assertion Helpers ───────────────────────────────────────────────────────

/**
 * Assert that a value is within φ-tolerance of expected.
 */
export function expectWithinPhiTolerance(
  actual: number,
  expected: number,
  tolerance = PHI_INV * 0.1,  // ~6.18% default tolerance
): void {
  const lowerBound = expected * (1 - tolerance);
  const upperBound = expected * (1 + tolerance);

  if (actual < lowerBound || actual > upperBound) {
    throw new Error(
      `Expected ${actual} to be within φ-tolerance (${tolerance * 100}%) of ${expected}. ` +
      `Range: [${lowerBound.toFixed(4)}, ${upperBound.toFixed(4)}]`
    );
  }
}

/**
 * Assert that an array has a Fibonacci length.
 */
export function expectFibonacciLength(arr: unknown[]): void {
  const fibNumbers = new Set([0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987]);
  if (!fibNumbers.has(arr.length)) {
    throw new Error(
      `Expected array length ${arr.length} to be a Fibonacci number`
    );
  }
}

// ─── Console Mock ────────────────────────────────────────────────────────────

/**
 * Suppress console output during tests.
 * Useful for testing error handling without cluttering output.
 */
export function suppressConsole(): () => void {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();

  return () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  };
}

// ─── Global Type Augmentation ────────────────────────────────────────────────

declare global {
  namespace Vi {
    interface Assertion {
      toBeWithinPhiTolerance(expected: number, tolerance?: number): void;
      toHaveFibonacciLength(): void;
    }
  }
}
