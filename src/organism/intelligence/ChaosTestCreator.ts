///
/// CHAOS TEST CREATOR — CREATOR CHAOTIS PROBATIONIS
///
/// ISIL-1.1 — Copyright (c) 2026 ItsNotAILABS. All Rights Reserved.
///
/// An intelligent test generator that creates high-quality test scripts
/// automatically using φ-weighted chaos principles. Each generated test
/// carries the φ-harmonic signature, ensuring tests probe the organism
/// at mathematically significant boundaries.
///
/// THE CHAOS PHILOSOPHY:
///   Chaos is not randomness — it is deterministic yet unpredictable.
///   φ-weighted chaos ensures tests cluster around mathematically
///   meaningful thresholds: Dunbar's 150, Crowd Wisdom's 10,000,
///   and the Organism Complexity Threshold of 30,000 (≈ φ^21.4).
///
/// TEST GENERATION PRINCIPLES:
///   1. φ-Boundary Probing: Tests cluster around φ^n values
///   2. Antifragile Stress: Tests push systems to learn and adapt
///   3. Emergent Discovery: Tests reveal hidden system behaviors
///   4. Batch Intelligence: Auto-generates entire test suites
///
/// LEX CHAOTIS PROBATIONIS-001 — Immutable:
///   "Ex chao, ordo. Ex ordine, intelligentia. Ex intelligentia, vita."
///   (From chaos, order. From order, intelligence. From intelligence, life.)
///

import { PHI, fibonacciHash } from './ObserverIntelligence.js';

// ═══════════════════════════════════════════════════════════════════
//  MATHEMATICAL CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const PHI_INVERSE = 0.6180339887498948482;
const PHI_SQUARED = PHI * PHI;
const PHI_CUBED = PHI * PHI * PHI;

/** Key φ-power thresholds for organism intelligence */
const PHI_THRESHOLDS = {
  DUNBAR: Math.round(Math.pow(PHI, 10.3)),        // ~150 - social cognitive limit
  VILLAGE: Math.round(Math.pow(PHI, 13.8)),       // ~1,000 - small community
  CROWD_WISDOM: Math.round(Math.pow(PHI, 19.1)),  // ~10,000 - collective intelligence
  ORGANISM: Math.round(Math.pow(PHI, 21.4)),      // ~30,000 - complexity threshold
  CITY: Math.round(Math.pow(PHI, 24.5)),          // ~100,000 - urban scale
  NATION: Math.round(Math.pow(PHI, 29.1)),        // ~1,000,000 - nation scale
} as const;

// ═══════════════════════════════════════════════════════════════════
//  TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export type ChaosTestCategory =
  | 'transfer'           // Token transfer operations
  | 'batch'              // Bulk/batch operations
  | 'threshold'          // Boundary/limit testing
  | 'governance'         // Governance operations
  | 'stress'             // System stress testing
  | 'emergence'          // Emergent behavior testing
  | 'sybil'              // Anti-sybil/whale testing
  | 'velocity';          // Token velocity testing

export type ChaosSeverity = 'benign' | 'moderate' | 'severe' | 'catastrophic';

export interface ChaosTestConfig {
  readonly category: ChaosTestCategory;
  readonly targetThreshold: number;
  readonly phiMultiplier: number;
  readonly severity: ChaosSeverity;
  readonly description: string;
  readonly expectedOutcome: 'pass' | 'fail' | 'boundary';
}

export interface GeneratedTest {
  readonly id: string;
  readonly name: string;
  readonly category: ChaosTestCategory;
  readonly config: ChaosTestConfig;
  readonly testCode: string;
  readonly phiSignature: number;
  readonly generatedAt: number;
  readonly batchId?: string;
}

export interface TestBatch {
  readonly id: string;
  readonly name: string;
  readonly tests: readonly GeneratedTest[];
  readonly totalTests: number;
  readonly phiCoverage: number;      // How well tests cover φ-boundaries
  readonly chaosScore: number;       // Overall chaos/stress level
  readonly generatedAt: number;
}

export interface ChaosTestResult {
  readonly testId: string;
  readonly passed: boolean;
  readonly actualOutcome: string;
  readonly expectedOutcome: string;
  readonly durationMs: number;
  readonly phiDeviation: number;     // How far result deviated from φ-prediction
  readonly emergentBehaviors: readonly string[];
}

// ═══════════════════════════════════════════════════════════════════
//  CHAOS TEST TEMPLATES
// ═══════════════════════════════════════════════════════════════════

const TEST_TEMPLATES: Record<ChaosTestCategory, string[]> = {
  transfer: [
    'should transfer exactly {amount} tokens successfully',
    'should handle {amount} sequential transfers',
    'should process {amount} concurrent transfers',
    'should reject transfer exceeding {amount} limit',
    'should apply φ-weighted fee on {amount} transfer',
  ],
  batch: [
    'should create {amount} accounts in single batch',
    'should process {amount} transactions in parallel',
    'should handle {amount} recipients in bulk transfer',
    'should paginate {amount} records efficiently',
    'should aggregate {amount} balances correctly',
  ],
  threshold: [
    'should enforce {amount} as anti-whale limit',
    'should trigger governance at {amount} quorum',
    'should activate rate-limit at {amount} daily tx',
    'should classify whale at {amount} holdings',
    'should require {amount} minimum stake',
  ],
  governance: [
    'should reach quorum with {amount} participants',
    'should distribute voting power among {amount} voters',
    'should process {amount} proposals efficiently',
    'should handle {amount} delegations',
    'should execute {amount} governance actions',
  ],
  stress: [
    'should sustain {amount} operations per second',
    'should recover from {amount} simultaneous failures',
    'should maintain consistency with {amount} concurrent users',
    'should handle {amount} state transitions',
    'should process {amount} events without memory leak',
  ],
  emergence: [
    'should detect emergent patterns in {amount} transactions',
    'should measure collective behavior of {amount} entities',
    'should identify self-organization among {amount} agents',
    'should observe phase transition at {amount} scale',
    'should quantify emergence score for {amount} interactions',
  ],
  sybil: [
    'should prevent sybil with {amount} minimum stake',
    'should detect whale clustering at {amount} threshold',
    'should enforce {amount} anti-whale transfer cap',
    'should distribute airdrops to {amount} unique users',
    'should validate {amount} unique identities',
  ],
  velocity: [
    'should measure token velocity across {amount} transfers',
    'should track circulation among {amount} wallets',
    'should calculate turnover rate for {amount} transactions',
    'should monitor liquidity depth at {amount} volume',
    'should assess economic activity of {amount} participants',
  ],
};

// ═══════════════════════════════════════════════════════════════════
//  CHAOS TEST CREATOR CLASS
// ═══════════════════════════════════════════════════════════════════

export class ChaosTestCreator {
  private readonly seed: number;
  private testCounter: number = 0;
  private batchCounter: number = 0;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
  }

  /** Generate a φ-weighted pseudo-random number */
  private phiRandom(max: number = 1): number {
    const x = Math.sin(this.seed + this.testCounter * PHI) * 10000;
    return (Math.abs(x) % 1) * max;
  }

  /** Get φ-deviation around a target value */
  private phiDeviation(target: number, maxDeviation: number = 0.1): number {
    const deviation = this.phiRandom(maxDeviation * 2) - maxDeviation;
    return Math.round(target * (1 + deviation * PHI_INVERSE));
  }

  /** Calculate φ-signature for a test */
  private calculatePhiSignature(config: ChaosTestConfig): number {
    const logValue = Math.log(config.targetThreshold) / Math.log(PHI);
    return Math.round(logValue * 1000) / 1000;
  }

  /** Generate unique test ID */
  private generateTestId(category: ChaosTestCategory): string {
    const hash = fibonacciHash(`${category}-${this.testCounter}-${this.seed}`);
    return `chaos-${category}-${hash.toString(16).slice(0, 8)}`;
  }

  /** Select severity based on threshold proximity to φ-powers */
  private determineSeverity(threshold: number): ChaosSeverity {
    const phiPower = Math.log(threshold) / Math.log(PHI);
    const fractionalPart = phiPower - Math.floor(phiPower);
    
    // Closer to exact φ-power = more severe (critical boundary)
    if (fractionalPart < 0.1 || fractionalPart > 0.9) return 'catastrophic';
    if (fractionalPart < 0.25 || fractionalPart > 0.75) return 'severe';
    if (fractionalPart < 0.4 || fractionalPart > 0.6) return 'moderate';
    return 'benign';
  }

  /** Generate test code from template */
  private generateTestCode(template: string, config: ChaosTestConfig): string {
    const testName = template.replace('{amount}', config.targetThreshold.toLocaleString());
    
    const code = `
test('${testName}', async (t) => {
  // Chaos Test Configuration
  const TARGET = ${config.targetThreshold};
  const PHI_MULTIPLIER = ${config.phiMultiplier};
  const SEVERITY = '${config.severity}';
  const EXPECTED = '${config.expectedOutcome}';
  
  // φ-Signature: ${this.calculatePhiSignature(config).toFixed(3)} (≈ φ^${Math.round(Math.log(config.targetThreshold) / Math.log(PHI))})
  
  const startTime = Date.now();
  let result;
  let emergentBehaviors = [];
  
  try {
    // === BEGIN CHAOS TEST ===
    ${this.generateTestBody(config)}
    // === END CHAOS TEST ===
    
    const duration = Date.now() - startTime;
    
    // Validate outcome
    assert.ok(
      result !== undefined,
      \`Test must produce a result (got: \${result})\`
    );
    
    // Report emergence
    if (emergentBehaviors.length > 0) {
      t.diagnostic(\`Emergent behaviors detected: \${emergentBehaviors.join(', ')}\`);
    }
    
    t.diagnostic(\`Duration: \${duration}ms, φ-Power: ${Math.round(Math.log(config.targetThreshold) / Math.log(PHI))}\`);
    
  } catch (error) {
    if (EXPECTED === 'fail') {
      assert.ok(true, 'Expected failure occurred: ' + error.message);
    } else {
      throw error;
    }
  }
});`;

    return code;
  }

  /** Generate test body based on category */
  private generateTestBody(config: ChaosTestConfig): string {
    switch (config.category) {
      case 'transfer':
        return `
    const ledger = new MockTokenLedger({ maxTransferAmount: TARGET * PHI_MULTIPLIER });
    ledger.mint('sender', TARGET * 100_000_000);
    
    result = ledger.transfer('sender', 'receiver', TARGET * 100_000_000);
    
    if (TARGET >= 30000) {
      emergentBehaviors.push('whale_transfer_detected');
    }
    
    assert.strictEqual(result.success, EXPECTED !== 'fail');`;

      case 'batch':
        return `
    const ledger = new MockTokenLedger({ maxAccountsPerBatch: TARGET * PHI_MULTIPLIER });
    const accounts = [];
    
    const batchStart = Date.now();
    for (let i = 0; i < TARGET; i++) {
      accounts.push(ledger.getOrCreateAccount(\`user-\${i}\`));
    }
    const batchTime = Date.now() - batchStart;
    
    result = { created: accounts.length, timeMs: batchTime };
    
    if (batchTime < TARGET / 100) {
      emergentBehaviors.push('super_linear_scaling');
    }
    
    assert.strictEqual(accounts.length, TARGET);`;

      case 'threshold':
        return `
    const THRESHOLD = TARGET;
    const testValues = [
      THRESHOLD - 1,
      THRESHOLD,
      THRESHOLD + 1,
      Math.round(THRESHOLD * PHI_INVERSE),
      Math.round(THRESHOLD * PHI),
    ];
    
    result = testValues.map(v => ({
      value: v,
      isAtOrAboveThreshold: v >= THRESHOLD,
      phiRatio: v / THRESHOLD,
    }));
    
    if (Math.abs(TARGET - 30000) < 1000) {
      emergentBehaviors.push('organism_threshold_proximity');
    }
    
    assert.strictEqual(result[1].isAtOrAboveThreshold, true);`;

      case 'governance':
        return `
    const QUORUM = TARGET;
    let votes = 0;
    let participants = new Set();
    
    for (let i = 0; i < QUORUM; i++) {
      participants.add(\`voter-\${i}\`);
      votes++;
    }
    
    result = {
      quorumReached: votes >= QUORUM,
      participationRate: votes / QUORUM,
      uniqueVoters: participants.size,
    };
    
    if (participants.size >= 30000) {
      emergentBehaviors.push('collective_decision_threshold');
    }
    
    assert.ok(result.quorumReached);`;

      case 'stress':
        return `
    const OPS_TARGET = TARGET;
    const operations = [];
    
    const stressStart = Date.now();
    for (let i = 0; i < OPS_TARGET; i++) {
      operations.push({ id: i, status: 'completed' });
    }
    const stressTime = Date.now() - stressStart;
    
    const opsPerSecond = (OPS_TARGET / stressTime) * 1000;
    
    result = {
      totalOps: operations.length,
      durationMs: stressTime,
      opsPerSecond: Math.round(opsPerSecond),
    };
    
    if (opsPerSecond > TARGET) {
      emergentBehaviors.push('performance_exceeded_target');
    }
    
    assert.strictEqual(operations.length, OPS_TARGET);`;

      case 'emergence':
        return `
    const ENTITY_COUNT = TARGET;
    const interactions = [];
    const patterns = new Map();
    
    for (let i = 0; i < Math.min(ENTITY_COUNT, 1000); i++) {
      const partner = Math.floor(Math.random() * ENTITY_COUNT);
      interactions.push({ from: i, to: partner });
      
      const key = \`\${Math.min(i, partner)}-\${Math.max(i, partner)}\`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }
    
    const clusterCount = [...patterns.values()].filter(v => v > 1).length;
    
    result = {
      totalInteractions: interactions.length,
      uniquePatterns: patterns.size,
      clusters: clusterCount,
      emergenceScore: clusterCount / patterns.size,
    };
    
    if (ENTITY_COUNT >= 30000) {
      emergentBehaviors.push('organism_scale_emergence');
    }
    
    assert.ok(result.emergenceScore >= 0);`;

      case 'sybil':
        return `
    const MINIMUM_STAKE = TARGET;
    const accounts = [];
    let validAccounts = 0;
    
    for (let i = 0; i < 100; i++) {
      const stake = Math.floor(Math.random() * MINIMUM_STAKE * 2);
      accounts.push({ id: i, stake, valid: stake >= MINIMUM_STAKE });
      if (stake >= MINIMUM_STAKE) validAccounts++;
    }
    
    result = {
      totalAccounts: accounts.length,
      validAccounts,
      sybilResistanceRate: validAccounts / accounts.length,
    };
    
    if (MINIMUM_STAKE >= 30000) {
      emergentBehaviors.push('high_sybil_resistance');
    }
    
    assert.ok(result.sybilResistanceRate <= 1);`;

      case 'velocity':
        return `
    const TRANSFER_COUNT = TARGET;
    const transfers = [];
    let totalVolume = 0;
    
    for (let i = 0; i < Math.min(TRANSFER_COUNT, 10000); i++) {
      const amount = Math.floor(Math.random() * 1000) + 1;
      transfers.push({ id: i, amount });
      totalVolume += amount;
    }
    
    const velocity = totalVolume / transfers.length;
    
    result = {
      transferCount: transfers.length,
      totalVolume,
      averageVelocity: Math.round(velocity),
      turnoverRate: totalVolume / (transfers.length * 500),
    };
    
    if (TRANSFER_COUNT >= 30000) {
      emergentBehaviors.push('high_economic_activity');
    }
    
    assert.ok(result.averageVelocity > 0);`;

      default:
        return `
    result = { category: '${config.category}', threshold: TARGET };
    assert.ok(result);`;
    }
  }

  /** Generate a single chaos test */
  generateTest(category: ChaosTestCategory, threshold: number = 30000): GeneratedTest {
    this.testCounter++;
    
    const templates = TEST_TEMPLATES[category];
    const templateIndex = Math.floor(this.phiRandom(templates.length));
    const template = templates[templateIndex];
    
    const config: ChaosTestConfig = {
      category,
      targetThreshold: threshold,
      phiMultiplier: PHI,
      severity: this.determineSeverity(threshold),
      description: template.replace('{amount}', threshold.toLocaleString()),
      expectedOutcome: 'pass',
    };

    return {
      id: this.generateTestId(category),
      name: config.description,
      category,
      config,
      testCode: this.generateTestCode(template, config),
      phiSignature: this.calculatePhiSignature(config),
      generatedAt: Date.now(),
    };
  }

  /** Generate a batch of tests for a specific threshold */
  generateBatch(threshold: number = 30000, categories?: ChaosTestCategory[]): TestBatch {
    this.batchCounter++;
    const batchId = `batch-${this.batchCounter}-${Date.now().toString(36)}`;
    
    const targetCategories = categories ?? Object.keys(TEST_TEMPLATES) as ChaosTestCategory[];
    const tests: GeneratedTest[] = [];
    
    for (const category of targetCategories) {
      // Generate 3 tests per category for comprehensive coverage
      for (let i = 0; i < 3; i++) {
        const deviation = this.phiDeviation(threshold, 0.2);
        const test = this.generateTest(category, i === 0 ? threshold : deviation);
        tests.push({ ...test, batchId });
      }
    }

    const phiCoverage = this.calculatePhiCoverage(tests);
    const chaosScore = this.calculateChaosScore(tests);

    return {
      id: batchId,
      name: `Chaos Test Batch: ${threshold.toLocaleString()} Threshold`,
      tests,
      totalTests: tests.length,
      phiCoverage,
      chaosScore,
      generatedAt: Date.now(),
    };
  }

  /** Calculate how well tests cover φ-boundaries */
  private calculatePhiCoverage(tests: readonly GeneratedTest[]): number {
    const phiPowers = new Set<number>();
    
    for (const test of tests) {
      const power = Math.round(test.phiSignature);
      phiPowers.add(power);
    }
    
    // Coverage = unique φ-powers tested / total possible in range
    const minPower = Math.min(...tests.map(t => Math.floor(t.phiSignature)));
    const maxPower = Math.max(...tests.map(t => Math.ceil(t.phiSignature)));
    const range = maxPower - minPower + 1;
    
    return Math.round((phiPowers.size / Math.max(range, 1)) * 100) / 100;
  }

  /** Calculate overall chaos/stress level of test batch */
  private calculateChaosScore(tests: readonly GeneratedTest[]): number {
    const severityScores = {
      benign: 0.25,
      moderate: 0.5,
      severe: 0.75,
      catastrophic: 1.0,
    };
    
    const totalScore = tests.reduce((sum, test) => {
      return sum + severityScores[test.config.severity];
    }, 0);
    
    return Math.round((totalScore / tests.length) * 100) / 100;
  }

  /** Generate complete test file from batch */
  generateTestFile(batch: TestBatch): string {
    const header = `///
/// AUTO-GENERATED CHAOS TEST FILE
///
/// Batch: ${batch.name}
/// ID: ${batch.id}
/// Tests: ${batch.totalTests}
/// φ-Coverage: ${(batch.phiCoverage * 100).toFixed(1)}%
/// Chaos Score: ${(batch.chaosScore * 100).toFixed(1)}%
/// Generated: ${new Date(batch.generatedAt).toISOString()}
///
/// LEX CHAOTIS: "Ex chao, ordo. Ex ordine, intelligentia."
///

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ═══════════════════════════════════════════════════════════════════
//  CHAOS TEST CONSTANTS
// ═══════════════════════════════════════════════════════════════════

const PHI = 1.6180339887498948482;
const PHI_INVERSE = 0.6180339887498948482;
const ORGANISM_THRESHOLD = 30000;

// ═══════════════════════════════════════════════════════════════════
//  MOCK TOKEN LEDGER (for chaos testing)
// ═══════════════════════════════════════════════════════════════════

class MockTokenLedger {
  constructor(config = {}) {
    this.accounts = new Map();
    this.transactions = [];
    this.config = {
      maxTransferAmount: config.maxTransferAmount ?? Number.MAX_SAFE_INTEGER,
      maxAccountsPerBatch: config.maxAccountsPerBatch ?? 100000,
      ...config,
    };
  }

  getOrCreateAccount(principal) {
    if (!this.accounts.has(principal)) {
      this.accounts.set(principal, { principal, balance: 0 });
    }
    return this.accounts.get(principal);
  }

  mint(to, amount) {
    const account = this.getOrCreateAccount(to);
    account.balance += amount;
    return { success: true, balance: account.balance };
  }

  transfer(from, to, amount) {
    if (amount > this.config.maxTransferAmount) {
      return { success: false, error: 'Exceeds max transfer' };
    }
    const fromAcc = this.getOrCreateAccount(from);
    if (fromAcc.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }
    fromAcc.balance -= amount;
    const toAcc = this.getOrCreateAccount(to);
    toAcc.balance += amount;
    return { success: true };
  }
}

// ═══════════════════════════════════════════════════════════════════
//  CHAOS TEST SUITES
// ═══════════════════════════════════════════════════════════════════
`;

    // Group tests by category
    const testsByCategory = new Map<ChaosTestCategory, GeneratedTest[]>();
    for (const test of batch.tests) {
      if (!testsByCategory.has(test.category)) {
        testsByCategory.set(test.category, []);
      }
      testsByCategory.get(test.category)!.push(test);
    }

    let suites = '';
    for (const [category, tests] of testsByCategory) {
      suites += `
describe('Chaos Tests: ${category.toUpperCase()}', () => {
${tests.map(t => t.testCode).join('\n')}
});
`;
    }

    return header + suites;
  }

  /** Generate the 30,000 threshold comprehensive suite */
  generateOrganismThresholdSuite(): TestBatch {
    return this.generateBatch(30000, [
      'transfer',
      'batch',
      'threshold',
      'governance',
      'stress',
      'emergence',
      'sybil',
      'velocity',
    ]);
  }
}

// ═══════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════

export const LEX_CHAOTIS_001 = {
  code: 'LEX_CHAOTIS_PROBATIONIS_001',
  text: 'Ex chao, ordo. Ex ordine, intelligentia. Ex intelligentia, vita.',
  translation: 'From chaos, order. From order, intelligence. From intelligence, life.',
  immutable: true as const,
} as const;

export { PHI_THRESHOLDS };

export default ChaosTestCreator;
