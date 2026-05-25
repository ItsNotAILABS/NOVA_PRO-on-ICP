/**
 * Zustand Store Tests — φ-Mathematics Validation
 *
 * Tests for the NOVA Platform store with Fibonacci threshold testing.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  useNovaStore,
  fib,
  nearestFib,
  phiWeight,
  phiWeightDepth,
  shouldTransition,
  PHI,
  PHI_INV,
} from '../src/store/nova-store';

describe('φ-Mathematics Utilities', () => {
  describe('fib()', () => {
    it('should return correct Fibonacci numbers', () => {
      expect(fib(0)).toBe(0);
      expect(fib(1)).toBe(1);
      expect(fib(2)).toBe(1);
      expect(fib(3)).toBe(2);
      expect(fib(4)).toBe(3);
      expect(fib(5)).toBe(5);
      expect(fib(6)).toBe(8);
      expect(fib(7)).toBe(13);
      expect(fib(8)).toBe(21);
      expect(fib(9)).toBe(34);
      expect(fib(10)).toBe(55);
    });

    it('should handle larger Fibonacci numbers', () => {
      expect(fib(12)).toBe(144);
      expect(fib(15)).toBe(610);
      expect(fib(20)).toBe(6765);
    });

    it('should throw for negative input', () => {
      expect(() => fib(-1)).toThrow(RangeError);
    });
  });

  describe('nearestFib()', () => {
    it('should return nearest Fibonacci number >= input', () => {
      expect(nearestFib(0)).toBe(0);
      expect(nearestFib(1)).toBe(1);
      expect(nearestFib(2)).toBe(2);
      expect(nearestFib(3)).toBe(3);
      expect(nearestFib(4)).toBe(5);
      expect(nearestFib(6)).toBe(8);
      expect(nearestFib(9)).toBe(13);
      expect(nearestFib(50)).toBe(55);
      expect(nearestFib(100)).toBe(144);
    });
  });

  describe('phiWeight()', () => {
    it('should compute φ-weight cycling through golden ratio', () => {
      const weight1 = phiWeight(1);
      const weight2 = phiWeight(2);
      const weight3 = phiWeight(3);

      expect(weight1).toBeCloseTo(PHI % 10, 10);
      expect(weight2).toBeCloseTo((2 * PHI) % 10, 10);
      expect(weight3).toBeCloseTo((3 * PHI) % 10, 10);
    });
  });

  describe('phiWeightDepth()', () => {
    it('should attenuate by φ^(-depth)', () => {
      const base = 100;

      expect(phiWeightDepth(base, 0)).toBe(100);
      expect(phiWeightDepth(base, 1)).toBeCloseTo(100 * PHI_INV, 10);
      expect(phiWeightDepth(base, 2)).toBeCloseTo(100 * PHI_INV * PHI_INV, 10);
    });
  });

  describe('shouldTransition()', () => {
    it('should return true when delta exceeds Fibonacci threshold', () => {
      expect(shouldTransition(0, 5, 1)).toBe(true);   // delta=5 >= F(5)=5
      expect(shouldTransition(0, 8, 1)).toBe(true);   // delta=8 >= F(6)=8
      expect(shouldTransition(0, 13, 1)).toBe(true);  // delta=13 >= F(7)=13
    });

    it('should return false when delta below Fibonacci threshold', () => {
      expect(shouldTransition(0, 0, 1)).toBe(false);  // delta=0 < minThreshold=1
      expect(shouldTransition(10, 11, 2)).toBe(false); // delta=1 < threshold=2
    });
  });
});

describe('NOVA Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useNovaStore.setState({
      canisters: {},
      connections: [],
      totalCycles: 0,
      totalMemory: 0,
      activeOrganisms: 0,
      systemHealth: 1,
      selectedCanisterId: null,
      sidebarOpen: true,
      theme: 'dark',
      notifications: [],
      lastSyncTimestamp: 0,
      syncIntervalMs: Math.round(PHI * 1000),
    });
  });

  describe('setCanister()', () => {
    it('should add a new canister', () => {
      const store = useNovaStore.getState();

      store.setCanister('brain', {
        name: 'Brain',
        status: 'active',
        elementClass: 'crimson',
        cycleBalance: 1_000_000_000,
        memoryUsed: 100_000_000,
      });

      const state = useNovaStore.getState();
      expect(state.canisters['brain']).toBeDefined();
      expect(state.canisters['brain'].name).toBe('Brain');
      expect(state.canisters['brain'].status).toBe('active');
      expect(state.canisters['brain'].elementClass).toBe('crimson');
    });

    it('should update existing canister', () => {
      const store = useNovaStore.getState();

      store.setCanister('brain', { name: 'Brain', status: 'active' });
      store.setCanister('brain', { status: 'migrating' });

      const state = useNovaStore.getState();
      expect(state.canisters['brain'].status).toBe('migrating');
      expect(state.canisters['brain'].name).toBe('Brain');  // Preserved
    });
  });

  describe('removeCanister()', () => {
    it('should remove canister and its connections', () => {
      const store = useNovaStore.getState();

      store.setCanister('brain', { name: 'Brain', status: 'active' });
      store.setCanister('nexus', { name: 'Nexus', status: 'active' });
      store.addConnection({ fromId: 'brain', toId: 'nexus', signalStrength: 0.9, lastSignal: Date.now() });

      store.removeCanister('brain');

      const state = useNovaStore.getState();
      expect(state.canisters['brain']).toBeUndefined();
      expect(state.connections.length).toBe(0);  // Connection removed
    });
  });

  describe('addConnection()', () => {
    it('should add a new connection', () => {
      const store = useNovaStore.getState();

      store.addConnection({
        fromId: 'brain',
        toId: 'nexus',
        signalStrength: 0.85,
        lastSignal: Date.now(),
      });

      const state = useNovaStore.getState();
      expect(state.connections.length).toBe(1);
      expect(state.connections[0].signalStrength).toBe(0.85);
    });

    it('should update existing connection when change exceeds Fibonacci threshold', () => {
      const store = useNovaStore.getState();

      store.addConnection({
        fromId: 'brain',
        toId: 'nexus',
        signalStrength: 0.5,
        lastSignal: Date.now(),
      });

      // Large change should update
      store.addConnection({
        fromId: 'brain',
        toId: 'nexus',
        signalStrength: 0.9,
        lastSignal: Date.now(),
      });

      const state = useNovaStore.getState();
      expect(state.connections.length).toBe(1);  // No duplicate
      expect(state.connections[0].signalStrength).toBe(0.9);  // Updated
    });
  });

  describe('addNotification()', () => {
    it('should add notification with φ-priority', () => {
      const store = useNovaStore.getState();

      store.addNotification({
        type: 'error',
        title: 'Error',
        message: 'Test error',
      });

      store.addNotification({
        type: 'info',
        title: 'Info',
        message: 'Test info',
      });

      const state = useNovaStore.getState();
      expect(state.notifications.length).toBe(2);
      // Error should be first (lower phiPriority = higher priority)
      expect(state.notifications[0].type).toBe('error');
    });

    it('should limit notifications to Fibonacci(13) = 13', () => {
      const store = useNovaStore.getState();

      // Add more than 13 notifications
      for (let i = 0; i < 20; i++) {
        store.addNotification({
          type: 'info',
          title: `Notification ${i}`,
          message: `Message ${i}`,
        });
      }

      const state = useNovaStore.getState();
      expect(state.notifications.length).toBeLessThanOrEqual(13);
    });
  });

  describe('updateMetrics()', () => {
    it('should update metrics when change exceeds Fibonacci threshold', () => {
      const store = useNovaStore.getState();

      // Small change - should be throttled for cycles (threshold F(8)=21)
      store.updateMetrics({ totalCycles: 10 });
      expect(useNovaStore.getState().totalCycles).toBe(0);  // Not updated

      // Large change - should update
      store.updateMetrics({ totalCycles: 1000 });
      expect(useNovaStore.getState().totalCycles).toBe(1000);
    });

    it('should always update systemHealth (critical metric)', () => {
      const store = useNovaStore.getState();

      store.updateMetrics({ systemHealth: 0.5 });
      expect(useNovaStore.getState().systemHealth).toBe(0.5);

      store.updateMetrics({ systemHealth: 0.51 });
      expect(useNovaStore.getState().systemHealth).toBe(0.51);
    });
  });
});
