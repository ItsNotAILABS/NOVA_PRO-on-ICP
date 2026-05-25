/**
 * NOVA Platform — XState Canister Lifecycle Machine
 *
 * State machine for managing canister lifecycle transitions.
 * Implements Fibonacci-threshold state transitions from the NOVA architecture.
 *
 * Lifecycle: dormant → initializing → active → migrating → evolved
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { createMachine, assign } from 'xstate';

// ─── φ-Mathematics Constants ─────────────────────────────────────────────────

const PHI = 1.6180339887498948482;

/** Fibonacci sequence for transition delays */
const FIB_DELAYS = {
  SHORT: 89,      // F(11)
  MEDIUM: 233,    // F(13)
  LONG: 610,      // F(15)
  PHI_MS: 1618,   // φ × 1000
};

// ─── Context Types ───────────────────────────────────────────────────────────

export interface CanisterContext {
  id: string;
  name: string;
  cycleBalance: number;
  memoryUsed: number;
  version: number;
  errorCount: number;
  maxRetries: number;  // F(5) = 5
  lastStateChange: number;
  migrationProgress: number;
  healthScore: number;  // 0-1, φ-weighted
}

export type CanisterEvent =
  | { type: 'INITIALIZE' }
  | { type: 'INIT_SUCCESS' }
  | { type: 'INIT_FAILURE'; error: string }
  | { type: 'ACTIVATE' }
  | { type: 'DEACTIVATE' }
  | { type: 'START_MIGRATION'; targetVersion: number }
  | { type: 'MIGRATION_PROGRESS'; progress: number }
  | { type: 'MIGRATION_COMPLETE' }
  | { type: 'MIGRATION_FAILURE'; error: string }
  | { type: 'EVOLVE' }
  | { type: 'ERROR'; error: string }
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'HEALTH_CHECK' }
  | { type: 'UPDATE_CYCLES'; cycles: number }
  | { type: 'UPDATE_MEMORY'; memory: number };

// ─── Machine Definition ──────────────────────────────────────────────────────

export const canisterLifecycleMachine = createMachine({
  id: 'canisterLifecycle',
  initial: 'dormant',
  context: {
    id: '',
    name: '',
    cycleBalance: 0,
    memoryUsed: 0,
    version: 1,
    errorCount: 0,
    maxRetries: 5,  // F(5)
    lastStateChange: Date.now(),
    migrationProgress: 0,
    healthScore: 1,
  } satisfies CanisterContext,

  on: {
    // Global events that can happen in any state
    UPDATE_CYCLES: {
      actions: assign({
        cycleBalance: ({ event }) => event.cycles,
      }),
    },
    UPDATE_MEMORY: {
      actions: assign({
        memoryUsed: ({ event }) => event.memory,
      }),
    },
    HEALTH_CHECK: {
      actions: assign({
        healthScore: ({ context }) => calculateHealthScore(context),
      }),
    },
  },

  states: {
    // ─── Dormant State ─────────────────────────────────────────────────────────
    dormant: {
      entry: assign({
        lastStateChange: () => Date.now(),
        healthScore: 0.3,  // Low health when dormant
      }),
      on: {
        INITIALIZE: {
          target: 'initializing',
        },
      },
    },

    // ─── Initializing State ────────────────────────────────────────────────────
    initializing: {
      entry: assign({
        lastStateChange: () => Date.now(),
        healthScore: 0.5,
        errorCount: 0,
      }),
      after: {
        // Timeout after φ × 1000ms (1618ms) - auto-retry or fail
        [FIB_DELAYS.PHI_MS]: {
          target: 'error',
          actions: assign({
            errorCount: ({ context }) => context.errorCount + 1,
          }),
        },
      },
      on: {
        INIT_SUCCESS: {
          target: 'active',
        },
        INIT_FAILURE: {
          target: 'error',
          actions: assign({
            errorCount: ({ context }) => context.errorCount + 1,
          }),
        },
      },
    },

    // ─── Active State ──────────────────────────────────────────────────────────
    active: {
      entry: assign({
        lastStateChange: () => Date.now(),
        healthScore: 1,
        errorCount: 0,
      }),
      on: {
        DEACTIVATE: {
          target: 'dormant',
        },
        START_MIGRATION: {
          target: 'migrating',
          actions: assign({
            migrationProgress: 0,
          }),
        },
        ERROR: {
          target: 'error',
          actions: assign({
            errorCount: ({ context }) => context.errorCount + 1,
          }),
        },
      },
    },

    // ─── Migrating State ───────────────────────────────────────────────────────
    migrating: {
      entry: assign({
        lastStateChange: () => Date.now(),
        healthScore: 0.7,
      }),
      after: {
        // Migration timeout: 5 × φ × 1000ms ≈ 8090ms
        [Math.round(5 * FIB_DELAYS.PHI_MS)]: {
          target: 'error',
          actions: assign({
            errorCount: ({ context }) => context.errorCount + 1,
          }),
        },
      },
      on: {
        MIGRATION_PROGRESS: {
          actions: assign({
            migrationProgress: ({ event }) => event.progress,
            // Health improves as migration progresses (φ-weighted)
            healthScore: ({ event }) => 0.7 + (event.progress * 0.3 * PHI / 2),
          }),
          // Fibonacci-threshold: only update if progress changes by at least 5%
          guard: ({ context, event }) =>
            Math.abs(event.progress - context.migrationProgress) >= 0.05,
        },
        MIGRATION_COMPLETE: {
          target: 'evolved',
          actions: assign({
            migrationProgress: 1,
            version: ({ context }) => context.version + 1,
          }),
        },
        MIGRATION_FAILURE: {
          target: 'error',
          actions: assign({
            errorCount: ({ context }) => context.errorCount + 1,
          }),
        },
      },
    },

    // ─── Evolved State ─────────────────────────────────────────────────────────
    evolved: {
      entry: assign({
        lastStateChange: () => Date.now(),
        healthScore: 1,
        migrationProgress: 0,
      }),
      after: {
        // Auto-transition to active after F(11)ms = 89ms
        [FIB_DELAYS.SHORT]: {
          target: 'active',
        },
      },
      on: {
        ACTIVATE: {
          target: 'active',
        },
      },
    },

    // ─── Error State ───────────────────────────────────────────────────────────
    error: {
      entry: assign({
        lastStateChange: () => Date.now(),
        healthScore: 0,
      }),
      on: {
        RETRY: [
          {
            // If under max retries, go back to initializing
            target: 'initializing',
            guard: ({ context }) => context.errorCount < context.maxRetries,
          },
          {
            // Otherwise stay in error (exhausted retries)
            target: 'error',
          },
        ],
        RESET: {
          target: 'dormant',
          actions: assign({
            errorCount: 0,
            migrationProgress: 0,
          }),
        },
      },
    },
  },
});

// ─── Health Score Calculator ─────────────────────────────────────────────────

function calculateHealthScore(context: CanisterContext): number {
  let score = 1;

  // Penalize for low cycle balance (φ-weighted)
  if (context.cycleBalance < 1_000_000_000) {
    score *= Math.pow(PHI, -1);  // ~0.618
  }
  if (context.cycleBalance < 100_000_000) {
    score *= Math.pow(PHI, -2);  // ~0.382
  }

  // Penalize for high memory usage (>80% of typical limit)
  const memoryLimit = 4 * 1024 * 1024 * 1024;  // 4GB
  if (context.memoryUsed > memoryLimit * 0.8) {
    score *= Math.pow(PHI, -1);
  }

  // Penalize for error history
  if (context.errorCount > 0) {
    score *= Math.pow(PHI, -context.errorCount);
  }

  return Math.max(0, Math.min(1, score));
}

// ─── Helper Types for React Integration ──────────────────────────────────────

export type CanisterState =
  | 'dormant'
  | 'initializing'
  | 'active'
  | 'migrating'
  | 'evolved'
  | 'error';

export const CANISTER_STATES: CanisterState[] = [
  'dormant',
  'initializing',
  'active',
  'migrating',
  'evolved',
  'error',
];

/** Element class mapping based on canister state */
export function getElementClassForState(state: CanisterState): 'gold' | 'silver' | 'crimson' {
  switch (state) {
    case 'active':
    case 'evolved':
      return 'gold';     // Stable, immutable-like
    case 'initializing':
    case 'migrating':
      return 'silver';   // Conducting/transitioning
    case 'dormant':
    case 'error':
      return 'crimson';  // Needs attention/action
  }
}

export default canisterLifecycleMachine;
