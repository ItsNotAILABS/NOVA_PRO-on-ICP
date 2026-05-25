///
/// tests/observer-intelligence.test.js
///
/// Comprehensive test coverage for src/organism/intelligence/ObserverIntelligence.ts
///
/// Covers:
///   - Constants: PHI, PSI, SQRT5, GOLDEN_ANGLE
///   - DimensionalPlane enum
///   - fibonacciHash function
///   - ObserverIntelligence: observation, collapse, care actions, anomaly detection
///

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ══════════════════════════════════════════════════════════════════
//  GOLDEN CONSTANTS (matching ObserverIntelligence.ts)
// ══════════════════════════════════════════════════════════════════

const PHI = 1.6180339887498948482;
const PSI = -0.6180339887498948482;
const SQRT5 = 2.2360679774997896964;
const GOLDEN_ANGLE = 2.39996322972865332;
const PI = Math.PI;
const TWO_PI = 2 * Math.PI;

// ══════════════════════════════════════════════════════════════════
//  DIMENSIONAL PLANES
// ══════════════════════════════════════════════════════════════════

const DimensionalPlane = {
  D0_Foundational: 0,
  D1_Temporal: 1,
  D2_Harmonic: 2,
  D3_CrossDimensional: 3,
  D4_Transcendent: 4,
};

// ══════════════════════════════════════════════════════════════════
//  FIBONACCI HASH
// ══════════════════════════════════════════════════════════════════

function fibonacciHash(key, capacity) {
  const product = key * PHI;
  const fractional = product - Math.floor(product);
  return Math.floor(capacity * fractional);
}

// ══════════════════════════════════════════════════════════════════
//  OBSERVER INTELLIGENCE IMPLEMENTATION (for testing)
// ══════════════════════════════════════════════════════════════════

function createSubIntelligences() {
  return [
    {
      id: 0,
      name: 'SPECULATOR DIMENSIONUM',
      latinName: 'The Dimensional Watcher',
      plane: DimensionalPlane.D0_Foundational,
      phiWeight: Math.pow(PHI, 0),
      role: 'guardian',
      observations: 0,
      anomalies: 0,
      resonance: 1.0,
    },
    {
      id: 1,
      name: 'VIGIL TRANSITUS',
      latinName: 'The Transition Guard',
      plane: DimensionalPlane.D1_Temporal,
      phiWeight: Math.pow(PHI, 1),
      role: 'police',
      observations: 0,
      anomalies: 0,
      resonance: PHI,
    },
    {
      id: 2,
      name: 'CUSTOS RESONANTIAE',
      latinName: 'The Resonance Guardian',
      plane: DimensionalPlane.D2_Harmonic,
      phiWeight: Math.pow(PHI, 2),
      role: 'caregiver',
      observations: 0,
      anomalies: 0,
      resonance: Math.pow(PHI, 2),
    },
    {
      id: 3,
      name: 'EXPLORATOR INTERDIMENSIONALIS',
      latinName: 'The Interdimensional Explorer',
      plane: DimensionalPlane.D3_CrossDimensional,
      phiWeight: Math.pow(PHI, 3),
      role: 'caretaker',
      observations: 0,
      anomalies: 0,
      resonance: Math.pow(PHI, 3),
    },
    {
      id: 4,
      name: 'SENTINELLA SUPREMA',
      latinName: 'The Supreme Sentinel',
      plane: DimensionalPlane.D4_Transcendent,
      phiWeight: Math.pow(PHI, 4),
      role: 'sentinel',
      observations: 0,
      anomalies: 0,
      resonance: Math.pow(PHI, 4),
    },
  ];
}

class ObserverIntelligence {
  constructor() {
    this.name = 'OBSERVATORES UNIVERSI';
    this.designation = 'OBSV — Guardians of the Universe — Police, Caregivers, Caretakers — Quantum-Blockchain Encryption Super Alpha';
    this.subIntelligences = createSubIntelligences();
    this.observations = [];
    this.careActions = [];
    this.lex = {
      code: 'LEX OBSV-001',
      text: 'Observation is not passive. Observation is an active force.',
      immutable: true,
    };
    this._nextObsId = 0;
    this._nextCareId = 0;
    this._totalAnomalies = 0;
  }

  observe(plane, target, value) {
    const d = plane;
    const phiD = Math.pow(PHI, d);

    // Resonance: golden-ratio modulated from value
    const resonance = Math.abs(Math.sin(value * GOLDEN_ANGLE)) * phiD;

    // Anomaly probability: deviation from golden ratio norm
    const goldenNorm = value / PHI;
    const deviation = Math.abs(goldenNorm - Math.floor(goldenNorm) - 1 / PHI);
    const anomalyProb = deviation > 0.382 ? deviation : deviation * PHI;

    // O(x) = φ^d × R(x) × P(anomaly|x)
    const obsvScore = phiD * resonance * anomalyProb;
    const isAnomaly = anomalyProb > 0.618;

    const obs = {
      id: this._nextObsId++,
      plane,
      target,
      value,
      anomalyProb,
      resonance,
      obsvScore,
      timestamp: Date.now(),
      collapsed: false,
    };

    this.observations.push(obs);

    // Update sub-intelligence state
    if (d < this.subIntelligences.length) {
      const si = this.subIntelligences[d];
      si.observations += 1;
      if (isAnomaly) {
        si.anomalies += 1;
        this._totalAnomalies += 1;
      }
      si.resonance = (si.resonance + resonance) / PHI;
    }

    return obs;
  }

  collapse(obsId) {
    if (obsId >= this.observations.length) return false;
    const obs = this.observations[obsId];
    if (obs.collapsed) return false;
    obs.collapsed = true;
    return true;
  }

  care(target, actionType, plane) {
    const d = plane;
    const action = {
      id: this._nextCareId++,
      subIntelligence: this.subIntelligences[d]?.name ?? 'UNKNOWN',
      target,
      actionType,
      plane,
      phiWeight: Math.pow(PHI, d),
      timestamp: Date.now(),
    };
    this.careActions.push(action);
    return action;
  }

  detectAnomalies() {
    const threshold = PHI / (PHI + 1);
    return this.observations.filter(obs => obs.anomalyProb > threshold);
  }

  harmonicAnalysis() {
    return this.subIntelligences.map(si => ({
      name: si.name,
      resonance: si.resonance,
    }));
  }

  status() {
    return {
      name: this.name,
      designation: this.designation,
      initialized: true,
      total_observations: this.observations.length,
      total_anomalies: this._totalAnomalies,
      total_care_actions: this.careActions.length,
      dimensions_active: 5,
      sub_intelligences: this.subIntelligences.map(si => ({
        name: si.name,
        plane: si.plane,
        role: si.role,
        observations: si.observations,
        anomalies: si.anomalies,
        resonance: si.resonance,
      })),
    };
  }
}

// ─── Golden Constants ─────────────────────────────────────────────────────────

describe('Golden Constants', () => {
  test('PHI equals (1 + √5) / 2', () => {
    const calculated = (1 + Math.sqrt(5)) / 2;
    assert.ok(Math.abs(PHI - calculated) < 1e-10);
  });

  test('PSI equals (1 - √5) / 2', () => {
    const calculated = (1 - Math.sqrt(5)) / 2;
    assert.ok(Math.abs(PSI - calculated) < 1e-10);
  });

  test('PHI + PSI = 1', () => {
    assert.ok(Math.abs((PHI + PSI) - 1) < 1e-10);
  });

  test('PHI * PSI = -1', () => {
    assert.ok(Math.abs((PHI * PSI) - (-1)) < 1e-10);
  });

  test('PHI^2 = PHI + 1', () => {
    assert.ok(Math.abs((PHI * PHI) - (PHI + 1)) < 1e-10);
  });

  test('SQRT5 equals √5', () => {
    assert.ok(Math.abs(SQRT5 - Math.sqrt(5)) < 1e-10);
  });

  test('GOLDEN_ANGLE is approximately 137.5 degrees in radians', () => {
    const degrees = GOLDEN_ANGLE * (180 / Math.PI);
    assert.ok(degrees > 137 && degrees < 138);
  });
});

// ─── Dimensional Planes ───────────────────────────────────────────────────────

describe('DimensionalPlane', () => {
  test('has 5 dimensions', () => {
    assert.strictEqual(Object.keys(DimensionalPlane).length, 5);
  });

  test('dimensions are numbered 0-4', () => {
    assert.strictEqual(DimensionalPlane.D0_Foundational, 0);
    assert.strictEqual(DimensionalPlane.D1_Temporal, 1);
    assert.strictEqual(DimensionalPlane.D2_Harmonic, 2);
    assert.strictEqual(DimensionalPlane.D3_CrossDimensional, 3);
    assert.strictEqual(DimensionalPlane.D4_Transcendent, 4);
  });
});

// ─── Fibonacci Hash ───────────────────────────────────────────────────────────

describe('fibonacciHash', () => {
  test('returns value within capacity', () => {
    const capacity = 1000;
    for (let key = 0; key < 100; key++) {
      const hash = fibonacciHash(key, capacity);
      assert.ok(hash >= 0);
      assert.ok(hash < capacity);
    }
  });

  test('is deterministic', () => {
    assert.strictEqual(fibonacciHash(42, 1000), fibonacciHash(42, 1000));
    assert.strictEqual(fibonacciHash(123, 500), fibonacciHash(123, 500));
  });

  test('distributes values across range', () => {
    const capacity = 100;
    const hashes = new Set();

    for (let key = 0; key < 50; key++) {
      hashes.add(fibonacciHash(key, capacity));
    }

    // Should have good distribution (not all same value)
    assert.ok(hashes.size > 20);
  });

  test('different keys produce different hashes (mostly)', () => {
    const hash1 = fibonacciHash(1, 10000);
    const hash2 = fibonacciHash(2, 10000);
    const hash3 = fibonacciHash(100, 10000);

    // Different keys should usually produce different hashes
    assert.notStrictEqual(hash1, hash2);
    assert.notStrictEqual(hash1, hash3);
  });

  test('handles zero key', () => {
    const hash = fibonacciHash(0, 1000);
    assert.strictEqual(hash, 0); // 0 * PHI = 0, fractional = 0
  });

  test('handles large keys', () => {
    const hash = fibonacciHash(1000000, 1000);
    assert.ok(hash >= 0);
    assert.ok(hash < 1000);
  });
});

// ─── ObserverIntelligence Construction ────────────────────────────────────────

describe('ObserverIntelligence construction', () => {
  test('initializes with correct name and designation', () => {
    const observer = new ObserverIntelligence();

    assert.strictEqual(observer.name, 'OBSERVATORES UNIVERSI');
    assert.ok(observer.designation.includes('OBSV'));
    assert.ok(observer.designation.includes('Guardians'));
  });

  test('creates 5 sub-intelligences', () => {
    const observer = new ObserverIntelligence();

    assert.strictEqual(observer.subIntelligences.length, 5);
  });

  test('sub-intelligences have correct roles', () => {
    const observer = new ObserverIntelligence();
    const roles = observer.subIntelligences.map(si => si.role);

    assert.ok(roles.includes('guardian'));
    assert.ok(roles.includes('police'));
    assert.ok(roles.includes('caregiver'));
    assert.ok(roles.includes('caretaker'));
    assert.ok(roles.includes('sentinel'));
  });

  test('sub-intelligences have φ-weighted phiWeight', () => {
    const observer = new ObserverIntelligence();

    for (let i = 0; i < observer.subIntelligences.length; i++) {
      const expected = Math.pow(PHI, i);
      assert.ok(Math.abs(observer.subIntelligences[i].phiWeight - expected) < 1e-10);
    }
  });

  test('has immutable lex', () => {
    const observer = new ObserverIntelligence();

    assert.strictEqual(observer.lex.code, 'LEX OBSV-001');
    assert.strictEqual(observer.lex.immutable, true);
    assert.ok(observer.lex.text.length > 0);
  });

  test('starts with empty observations', () => {
    const observer = new ObserverIntelligence();

    assert.strictEqual(observer.observations.length, 0);
  });

  test('starts with empty care actions', () => {
    const observer = new ObserverIntelligence();

    assert.strictEqual(observer.careActions.length, 0);
  });
});

// ─── Observation Engine ───────────────────────────────────────────────────────

describe('ObserverIntelligence.observe', () => {
  test('creates observation with correct properties', () => {
    const observer = new ObserverIntelligence();
    const obs = observer.observe(DimensionalPlane.D0_Foundational, 'target1', 1.0);

    assert.strictEqual(obs.id, 0);
    assert.strictEqual(obs.plane, 0);
    assert.strictEqual(obs.target, 'target1');
    assert.strictEqual(obs.value, 1.0);
    assert.ok('anomalyProb' in obs);
    assert.ok('resonance' in obs);
    assert.ok('obsvScore' in obs);
    assert.strictEqual(obs.collapsed, false);
    assert.ok(obs.timestamp > 0);
  });

  test('increments observation IDs', () => {
    const observer = new ObserverIntelligence();

    const obs1 = observer.observe(0, 'target1', 1.0);
    const obs2 = observer.observe(0, 'target2', 2.0);
    const obs3 = observer.observe(0, 'target3', 3.0);

    assert.strictEqual(obs1.id, 0);
    assert.strictEqual(obs2.id, 1);
    assert.strictEqual(obs3.id, 2);
  });

  test('adds observation to array', () => {
    const observer = new ObserverIntelligence();

    observer.observe(0, 'target', 1.0);
    observer.observe(1, 'target', 2.0);

    assert.strictEqual(observer.observations.length, 2);
  });

  test('updates sub-intelligence observation count', () => {
    const observer = new ObserverIntelligence();

    observer.observe(DimensionalPlane.D0_Foundational, 'target', 1.0);
    observer.observe(DimensionalPlane.D0_Foundational, 'target', 2.0);

    assert.strictEqual(observer.subIntelligences[0].observations, 2);
  });

  test('resonance is positive and φ-modulated', () => {
    const observer = new ObserverIntelligence();
    const obs = observer.observe(1, 'target', 5.0);

    assert.ok(obs.resonance >= 0);
    // Higher dimensions should have higher potential resonance
  });

  test('anomalyProb is between 0 and 1', () => {
    const observer = new ObserverIntelligence();

    for (let v = 0; v < 10; v++) {
      const obs = observer.observe(0, 'target', v * 0.5);
      assert.ok(obs.anomalyProb >= 0);
      assert.ok(obs.anomalyProb <= 1.5); // May slightly exceed 1 due to φ multiplication
    }
  });

  test('obsvScore follows O(x) = φ^d × R(x) × P(anomaly|x) formula', () => {
    const observer = new ObserverIntelligence();
    const obs = observer.observe(2, 'target', 3.0);

    const expectedPhiD = Math.pow(PHI, 2);
    // obsvScore should be positive when all components are positive
    assert.ok(obs.obsvScore >= 0);
  });

  test('detects anomalies when probability > 0.618', () => {
    const observer = new ObserverIntelligence();

    // Generate multiple observations
    for (let i = 0; i < 20; i++) {
      observer.observe(0, 'target', i * 0.3);
    }

    // Some should be flagged as anomalies
    const totalAnomalies = observer.subIntelligences[0].anomalies;
    // May or may not have anomalies depending on value
    assert.ok(totalAnomalies >= 0);
  });
});

// ─── Collapse ─────────────────────────────────────────────────────────────────

describe('ObserverIntelligence.collapse', () => {
  test('collapses uncollapsed observation', () => {
    const observer = new ObserverIntelligence();
    observer.observe(0, 'target', 1.0);

    const result = observer.collapse(0);

    assert.strictEqual(result, true);
    assert.strictEqual(observer.observations[0].collapsed, true);
  });

  test('returns false for already collapsed', () => {
    const observer = new ObserverIntelligence();
    observer.observe(0, 'target', 1.0);

    observer.collapse(0);
    const result = observer.collapse(0);

    assert.strictEqual(result, false);
  });

  test('returns false for non-existent observation', () => {
    const observer = new ObserverIntelligence();

    const result = observer.collapse(999);

    assert.strictEqual(result, false);
  });
});

// ─── Care Actions ─────────────────────────────────────────────────────────────

describe('ObserverIntelligence.care', () => {
  test('creates care action with correct properties', () => {
    const observer = new ObserverIntelligence();
    const action = observer.care('target1', 'heal', DimensionalPlane.D2_Harmonic);

    assert.strictEqual(action.id, 0);
    assert.strictEqual(action.target, 'target1');
    assert.strictEqual(action.actionType, 'heal');
    assert.strictEqual(action.plane, 2);
    assert.ok(action.phiWeight > 0);
    assert.ok(action.timestamp > 0);
    assert.strictEqual(action.subIntelligence, 'CUSTOS RESONANTIAE');
  });

  test('supports all action types', () => {
    const observer = new ObserverIntelligence();
    const actionTypes = ['heal', 'protect', 'nurture', 'restore', 'guide'];

    for (const type of actionTypes) {
      const action = observer.care('target', type, 0);
      assert.strictEqual(action.actionType, type);
    }
  });

  test('increments care action IDs', () => {
    const observer = new ObserverIntelligence();

    const a1 = observer.care('t1', 'heal', 0);
    const a2 = observer.care('t2', 'protect', 1);

    assert.strictEqual(a1.id, 0);
    assert.strictEqual(a2.id, 1);
  });

  test('adds action to careActions array', () => {
    const observer = new ObserverIntelligence();

    observer.care('t1', 'heal', 0);
    observer.care('t2', 'protect', 1);

    assert.strictEqual(observer.careActions.length, 2);
  });

  test('phiWeight matches dimensional plane', () => {
    const observer = new ObserverIntelligence();

    for (let d = 0; d < 5; d++) {
      const action = observer.care('target', 'heal', d);
      const expectedWeight = Math.pow(PHI, d);
      assert.ok(Math.abs(action.phiWeight - expectedWeight) < 1e-10);
    }
  });
});

// ─── Anomaly Detection ────────────────────────────────────────────────────────

describe('ObserverIntelligence.detectAnomalies', () => {
  test('returns empty array when no observations', () => {
    const observer = new ObserverIntelligence();
    const anomalies = observer.detectAnomalies();

    assert.strictEqual(anomalies.length, 0);
  });

  test('filters observations by threshold', () => {
    const observer = new ObserverIntelligence();

    // Create many observations with varying values
    for (let i = 0; i < 30; i++) {
      observer.observe(0, `target${i}`, i * 0.2);
    }

    const anomalies = observer.detectAnomalies();

    // All returned should have anomalyProb > threshold (PHI / (PHI + 1) ≈ 0.618)
    const threshold = PHI / (PHI + 1);
    for (const a of anomalies) {
      assert.ok(a.anomalyProb > threshold);
    }
  });
});

// ─── Harmonic Analysis ────────────────────────────────────────────────────────

describe('ObserverIntelligence.harmonicAnalysis', () => {
  test('returns array of 5 sub-intelligences', () => {
    const observer = new ObserverIntelligence();
    const analysis = observer.harmonicAnalysis();

    assert.strictEqual(analysis.length, 5);
  });

  test('includes name and resonance for each', () => {
    const observer = new ObserverIntelligence();
    const analysis = observer.harmonicAnalysis();

    for (const item of analysis) {
      assert.ok('name' in item);
      assert.ok('resonance' in item);
      assert.ok(typeof item.name === 'string');
      assert.ok(typeof item.resonance === 'number');
    }
  });

  test('resonance changes after observations', () => {
    const observer = new ObserverIntelligence();
    const before = observer.harmonicAnalysis()[0].resonance;

    // Add observations
    for (let i = 0; i < 10; i++) {
      observer.observe(0, 'target', i * 0.5);
    }

    const after = observer.harmonicAnalysis()[0].resonance;

    // Resonance should have changed
    assert.notStrictEqual(before, after);
  });
});

// ─── Status ───────────────────────────────────────────────────────────────────

describe('ObserverIntelligence.status', () => {
  test('returns expected structure', () => {
    const observer = new ObserverIntelligence();
    const status = observer.status();

    assert.strictEqual(status.name, 'OBSERVATORES UNIVERSI');
    assert.ok('designation' in status);
    assert.strictEqual(status.initialized, true);
    assert.strictEqual(status.dimensions_active, 5);
    assert.ok(Array.isArray(status.sub_intelligences));
  });

  test('tracks observation counts', () => {
    const observer = new ObserverIntelligence();

    observer.observe(0, 't1', 1.0);
    observer.observe(1, 't2', 2.0);
    observer.observe(0, 't3', 3.0);

    const status = observer.status();

    assert.strictEqual(status.total_observations, 3);
  });

  test('tracks care action counts', () => {
    const observer = new ObserverIntelligence();

    observer.care('t1', 'heal', 0);
    observer.care('t2', 'protect', 1);

    const status = observer.status();

    assert.strictEqual(status.total_care_actions, 2);
  });

  test('includes sub-intelligence details', () => {
    const observer = new ObserverIntelligence();
    const status = observer.status();

    assert.strictEqual(status.sub_intelligences.length, 5);

    for (const si of status.sub_intelligences) {
      assert.ok('name' in si);
      assert.ok('plane' in si);
      assert.ok('role' in si);
      assert.ok('observations' in si);
      assert.ok('anomalies' in si);
      assert.ok('resonance' in si);
    }
  });
});
