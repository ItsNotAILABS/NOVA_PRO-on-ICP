#!/usr/bin/env node
///
/// tests/run.mjs — Sovereign Test Runner
///
/// Runs all test suites in a single Node.js process using node:test.
/// Each test file is run sequentially; failures are accumulated and reported.
///
/// Usage:  node tests/run.mjs
///
/// The @medina/* module shims are registered via tests/hooks.mjs before
/// any test file is imported.
///

import { register } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dir      = dirname(__filename);

// Register the @medina/* shim resolver BEFORE importing any test files
register(pathToFileURL(join(__dir, 'hooks.mjs')).href, pathToFileURL('./'));

// ─── Test files ──────────────────────────────────────────────────────────

const TEST_FILES = [
  // ─── Existing SDK Tests ─────────────────────────────────────────────────
  join(__dir, 'geometric-key-protocol.test.js'),
  join(__dir, 'geometry-lock-sdk.test.js'),
  join(__dir, 'geometry-bridge.test.js'),
  join(__dir, 'medina-heart.test.js'),
  join(__dir, 'authentication-protocol.test.js'),
  join(__dir, 'medina-registry.test.js'),
  join(__dir, 'nova-bridge.test.js'),
  join(__dir, 'consensus-protocol.test.js'),
  join(__dir, 'neural-mesh.test.js'),
  join(__dir, 'swarm-intelligence.test.js'),
  join(__dir, 'protocol-241-275-map.test.js'),
  join(__dir, 'protocol-241-275-runtime.test.js'),
  join(__dir, 'thesis-alpha-constants.test.js'),
  join(__dir, 'birth-ai.test.js'),
  join(__dir, 'alpha-sdk.test.js'),
  // ─── New SDK Protocol Tests ─────────────────────────────────────────────
  join(__dir, 'governance-protocol.test.js'),
  join(__dir, 'temporal-sync.test.js'),
  join(__dir, 'discovery-protocol.test.js'),
  // ─── Core Module Tests ──────────────────────────────────────────────────
  join(__dir, 'nova-tokenizer.test.js'),
  join(__dir, 'observer-intelligence.test.js'),
  join(__dir, 'ai-protocol-engine.test.js'),
].map(f => pathToFileURL(f).href);

// Dynamic import runs the test file in the current process,
// allowing node:test to collect all results in one TAP stream.
for (const file of TEST_FILES) {
  await import(file);
}
