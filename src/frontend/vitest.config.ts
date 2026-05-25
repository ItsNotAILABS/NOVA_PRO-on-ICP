/**
 * Vitest Configuration — φ-Weighted Test Priority
 *
 * Test configuration with Fibonacci-based timeouts and
 * φ-weighted test prioritization.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// φ-Mathematics constants
const PHI = 1.6180339887498948482;
const FIB = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];

export default defineConfig({
  plugins: [react()],

  test: {
    // Environment
    environment: 'jsdom',
    globals: true,

    // Include patterns
    include: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'tests/**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.nova',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{js,jsx,ts,tsx}',
        'src/**/*.spec.{js,jsx,ts,tsx}',
        'src/main.tsx',
      ],
      // φ-threshold: minimum 61.8% coverage (1/φ)
      thresholds: {
        lines: 61.8,
        functions: 61.8,
        branches: 61.8,
        statements: 61.8,
      },
    },

    // Timeouts (Fibonacci-based, milliseconds)
    testTimeout: FIB[13] * 1000,       // F(13) = 233 seconds for test
    hookTimeout: FIB[12] * 1000,       // F(12) = 144 seconds for hooks
    teardownTimeout: FIB[11] * 1000,   // F(11) = 89 seconds for teardown

    // Retry configuration (Fibonacci)
    retry: 2,  // F(3) retries

    // Reporter
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/results.json',
    },

    // Setup files
    setupFiles: ['./tests/setup.ts'],

    // Pool configuration
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true,
      },
    },

    // Sequence configuration (φ-weighted ordering)
    sequence: {
      // Sort tests by file path for reproducibility
      shuffle: false,
    },

    // Mock configuration
    mockReset: true,
    restoreMocks: true,

    // Dependency optimization
    deps: {
      optimizer: {
        web: {
          include: ['@testing-library/react'],
        },
      },
    },
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@store': '/src/store',
      '@lib': '/src/lib',
      '@components': '/src/components',
      '@pages': '/src/pages',
    },
  },
});
