///
/// tests/temporal-sync.test.js
///
/// Comprehensive test coverage for sdk/temporal-sync/src/index.js
///
/// Covers:
///   - TemporalClock: construction, now, tick, sync
///   - SynchronizationPoint: construction, arrive, isReady
///   - TemporalCoordinator: clock registration, sync points, φ-intervals
///

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  TemporalClock,
  SynchronizationPoint,
  TemporalCoordinator,
} from '../sdk/temporal-sync/src/index.js';

// ─── TemporalClock ────────────────────────────────────────────────────────────

describe('TemporalClock', () => {
  test('constructs with organismId', () => {
    const clock = new TemporalClock({ organismId: 'org1' });

    assert.strictEqual(clock.organismId, 'org1');
    assert.strictEqual(clock.offset, 0);
    assert.strictEqual(clock.ticks, 0);
    assert.ok(clock.started > 0);
  });

  test('constructs with custom offset', () => {
    const clock = new TemporalClock({ organismId: 'org1', offset: 1000 });

    assert.strictEqual(clock.offset, 1000);
  });

  test('now returns current time plus offset', () => {
    const clock = new TemporalClock({ organismId: 'org1', offset: 5000 });
    const before = Date.now();
    const now = clock.now();
    const after = Date.now();

    assert.ok(now >= before + 5000);
    assert.ok(now <= after + 5000);
  });

  test('now returns current time when offset is zero', () => {
    const clock = new TemporalClock({ organismId: 'org1', offset: 0 });
    const before = Date.now();
    const now = clock.now();
    const after = Date.now();

    assert.ok(now >= before);
    assert.ok(now <= after);
  });

  test('tick increments and returns tick count', () => {
    const clock = new TemporalClock({ organismId: 'org1' });

    assert.strictEqual(clock.tick(), 1);
    assert.strictEqual(clock.tick(), 2);
    assert.strictEqual(clock.tick(), 3);
    assert.strictEqual(clock.ticks, 3);
  });

  test('sync updates offset based on reference time', () => {
    const clock = new TemporalClock({ organismId: 'org1', offset: 0 });
    const referenceTime = Date.now() + 10000; // 10 seconds in future

    const newOffset = clock.sync(referenceTime);

    assert.ok(newOffset >= 9900 && newOffset <= 10100); // Allow small timing variance
    assert.strictEqual(clock.offset, newOffset);
  });

  test('sync with past time creates negative offset', () => {
    const clock = new TemporalClock({ organismId: 'org1' });
    const pastTime = Date.now() - 5000;

    const newOffset = clock.sync(pastTime);

    assert.ok(newOffset < 0);
    assert.ok(newOffset >= -5100 && newOffset <= -4900);
  });
});

// ─── SynchronizationPoint ─────────────────────────────────────────────────────

describe('SynchronizationPoint', () => {
  test('constructs with targetTime and participants', () => {
    const targetTime = Date.now() + 1000;
    const syncPoint = new SynchronizationPoint({
      targetTime,
      participants: ['org1', 'org2', 'org3'],
    });

    assert.strictEqual(syncPoint.targetTime, targetTime);
    assert.strictEqual(syncPoint.participants.size, 3);
    assert.strictEqual(syncPoint.arrived.size, 0);
    assert.strictEqual(syncPoint.executed, false);
  });

  test('constructs with empty participants', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now(),
    });

    assert.strictEqual(syncPoint.participants.size, 0);
    assert.strictEqual(syncPoint.arrived.size, 0);
  });

  test('arrive adds organism and returns false when not all arrived', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now() + 1000,
      participants: ['org1', 'org2', 'org3'],
    });

    const result = syncPoint.arrive('org1');

    assert.strictEqual(result, false);
    assert.strictEqual(syncPoint.arrived.size, 1);
    assert.ok(syncPoint.arrived.has('org1'));
  });

  test('arrive returns true when all participants arrived', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now() + 1000,
      participants: ['org1', 'org2'],
    });

    syncPoint.arrive('org1');
    const result = syncPoint.arrive('org2');

    assert.strictEqual(result, true);
    assert.strictEqual(syncPoint.arrived.size, 2);
  });

  test('arrive handles duplicate arrivals', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now() + 1000,
      participants: ['org1', 'org2'],
    });

    syncPoint.arrive('org1');
    syncPoint.arrive('org1'); // Duplicate

    assert.strictEqual(syncPoint.arrived.size, 1);
  });

  test('isReady returns false when not all arrived', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now() - 1000, // Past time
      participants: ['org1', 'org2'],
    });

    syncPoint.arrive('org1');

    assert.strictEqual(syncPoint.isReady(), false);
  });

  test('isReady returns false when target time not reached', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now() + 10000, // Future time
      participants: ['org1', 'org2'],
    });

    syncPoint.arrive('org1');
    syncPoint.arrive('org2');

    assert.strictEqual(syncPoint.isReady(), false);
  });

  test('isReady returns true when all arrived and time reached', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now() - 1000, // Past time
      participants: ['org1', 'org2'],
    });

    syncPoint.arrive('org1');
    syncPoint.arrive('org2');

    assert.strictEqual(syncPoint.isReady(), true);
  });

  test('isReady returns true for empty participants when time reached', () => {
    const syncPoint = new SynchronizationPoint({
      targetTime: Date.now() - 1000,
      participants: [],
    });

    assert.strictEqual(syncPoint.isReady(), true);
  });
});

// ─── TemporalCoordinator ──────────────────────────────────────────────────────

describe('TemporalCoordinator', () => {
  test('constructs with empty state', () => {
    const coordinator = new TemporalCoordinator();

    assert.strictEqual(coordinator.clocks.size, 0);
    assert.strictEqual(coordinator.syncPoints.length, 0);
    assert.ok(coordinator.masterTime > 0);
  });

  test('registerClock creates and stores clock', () => {
    const coordinator = new TemporalCoordinator();

    const clock = coordinator.registerClock('org1');

    assert.ok(clock instanceof TemporalClock);
    assert.strictEqual(clock.organismId, 'org1');
    assert.strictEqual(coordinator.clocks.size, 1);
    assert.ok(coordinator.clocks.has('org1'));
  });

  test('registerClock handles multiple organisms', () => {
    const coordinator = new TemporalCoordinator();

    coordinator.registerClock('org1');
    coordinator.registerClock('org2');
    coordinator.registerClock('org3');

    assert.strictEqual(coordinator.clocks.size, 3);
  });

  test('createSyncPoint creates and stores sync point', () => {
    const coordinator = new TemporalCoordinator();
    const before = Date.now();

    const syncPoint = coordinator.createSyncPoint(1000, ['org1', 'org2']);

    assert.ok(syncPoint instanceof SynchronizationPoint);
    assert.ok(syncPoint.targetTime >= before + 1000);
    assert.strictEqual(syncPoint.participants.size, 2);
    assert.strictEqual(coordinator.syncPoints.length, 1);
  });

  test('createSyncPoint with zero delay', () => {
    const coordinator = new TemporalCoordinator();
    const before = Date.now();

    const syncPoint = coordinator.createSyncPoint(0, ['org1']);

    assert.ok(syncPoint.targetTime >= before);
    assert.ok(syncPoint.targetTime <= before + 100);
  });

  test('syncAll synchronizes all clocks', () => {
    const coordinator = new TemporalCoordinator();

    const clock1 = coordinator.registerClock('org1');
    const clock2 = coordinator.registerClock('org2');

    // Give clocks different offsets initially
    clock1.offset = 1000;
    clock2.offset = -500;

    const result = coordinator.syncAll();

    assert.strictEqual(result.synced, 2);
    assert.ok(result.time > 0);

    // After sync, clocks should have similar now() values
    const diff = Math.abs(clock1.now() - clock2.now());
    assert.ok(diff < 10); // Within 10ms tolerance
  });

  test('syncAll with no clocks', () => {
    const coordinator = new TemporalCoordinator();

    const result = coordinator.syncAll();

    assert.strictEqual(result.synced, 0);
    assert.ok(result.time > 0);
  });

  test('syncAll updates master time', () => {
    const coordinator = new TemporalCoordinator();
    const initialMasterTime = coordinator.masterTime;

    // Wait a bit
    coordinator.registerClock('org1');

    const result = coordinator.syncAll();

    assert.strictEqual(coordinator.masterTime, result.time);
    assert.ok(result.time >= initialMasterTime);
  });

  test('getPhiInterval returns φ-derived interval', () => {
    const coordinator = new TemporalCoordinator();

    const interval = coordinator.getPhiInterval();

    // HEARTBEAT_MS = 873 (φ-derived: 540 × φ ≈ 873ms)
    assert.strictEqual(interval, 873);
  });

  test('schedulePhiEvent returns interval ID', () => {
    const coordinator = new TemporalCoordinator();
    let called = false;

    const intervalId = coordinator.schedulePhiEvent(() => {
      called = true;
    }, 1);

    assert.ok(intervalId !== null);
    assert.ok(typeof intervalId === 'object' || typeof intervalId === 'number');

    // Clean up
    clearInterval(intervalId);
  });

  test('schedulePhiEvent with multiplier', () => {
    const coordinator = new TemporalCoordinator();
    const baseInterval = coordinator.getPhiInterval();

    // We can't directly test the interval timing, but we can verify it returns
    const intervalId = coordinator.schedulePhiEvent(() => {}, 2);

    assert.ok(intervalId !== null);

    // Clean up
    clearInterval(intervalId);
  });

  test('multiple sync points can coexist', () => {
    const coordinator = new TemporalCoordinator();

    const sp1 = coordinator.createSyncPoint(100, ['org1']);
    const sp2 = coordinator.createSyncPoint(200, ['org2']);
    const sp3 = coordinator.createSyncPoint(300, ['org1', 'org2']);

    assert.strictEqual(coordinator.syncPoints.length, 3);
    assert.ok(sp1.targetTime < sp2.targetTime);
    assert.ok(sp2.targetTime < sp3.targetTime);
  });

  test('clocks can be retrieved after registration', () => {
    const coordinator = new TemporalCoordinator();

    coordinator.registerClock('org1');

    const clock = coordinator.clocks.get('org1');
    assert.ok(clock instanceof TemporalClock);
    assert.strictEqual(clock.organismId, 'org1');
  });
});
