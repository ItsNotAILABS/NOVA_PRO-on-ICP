/**
 * NOVA Platform — Zustand Store with φ-Mathematics
 *
 * State management using φ-weighted slices and Fibonacci thresholds.
 * Implements the φ-weighted state tree pattern from the NOVA architecture.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ─── φ-Mathematics Constants ─────────────────────────────────────────────────

/** Golden ratio */
export const PHI = 1.6180339887498948482;

/** 1/φ */
export const PHI_INV = 0.6180339887498948;

/** Fibonacci sequence cache */
const fibCache = new Map<number, number>([[0, 0], [1, 1]]);

/** Returns the n-th Fibonacci number */
export function fib(n: number): number {
  if (n < 0) throw new RangeError(`fib(${n}): n must be >= 0`);
  if (fibCache.has(n)) return fibCache.get(n)!;
  const result = fib(n - 1) + fib(n - 2);
  fibCache.set(n, result);
  return result;
}

/** Returns the nearest Fibonacci number >= n */
export function nearestFib(n: number): number {
  if (n <= 0) return 0;
  let a = 0, b = 1;
  while (b < n) { const t = a + b; a = b; b = t; }
  return b;
}

/** φ-weight for state priority (higher = more important) */
export function phiWeight(priority: number): number {
  return Math.pow(PHI, priority);
}

/** φ-dampened value (attenuates by depth) */
export function phiWeightDepth(value: number, depth: number): number {
  return value * Math.pow(PHI, -depth);
}

// ─── Canister Lifecycle Types ────────────────────────────────────────────────

export type CanisterStatus =
  | 'dormant'       // Not yet initialized
  | 'initializing'  // Starting up
  | 'active'        // Fully operational
  | 'migrating'     // State transfer in progress
  | 'evolved'       // Post-upgrade state
  | 'error';        // Failure state

export type ElementClass = 'gold' | 'silver' | 'crimson';

export interface CanisterState {
  id: string;
  name: string;
  status: CanisterStatus;
  elementClass: ElementClass;
  cycleBalance: number;
  memoryUsed: number;
  lastUpdated: number;
  errorMessage?: string;
  /** φ-priority for update ordering (0 = highest) */
  phiPriority: number;
}

export interface OrganismConnection {
  fromId: string;
  toId: string;
  signalStrength: number;  // 0-1, φ-weighted
  lastSignal: number;
}

// ─── Platform State Interface ────────────────────────────────────────────────

export interface NovaPlatformState {
  // ─── Canister Registry ─────────────────────────────────────────────────────
  canisters: Record<string, CanisterState>;
  connections: OrganismConnection[];

  // ─── Global Metrics ────────────────────────────────────────────────────────
  totalCycles: number;
  totalMemory: number;
  activeOrganisms: number;
  systemHealth: number;  // 0-1, φ-weighted aggregate

  // ─── UI State ──────────────────────────────────────────────────────────────
  selectedCanisterId: string | null;
  sidebarOpen: boolean;
  theme: 'dark' | 'light';
  notifications: Notification[];

  // ─── φ-Synchronization ─────────────────────────────────────────────────────
  lastSyncTimestamp: number;
  syncIntervalMs: number;  // Default: 1618ms (φ × 1000)

  // ─── Actions ───────────────────────────────────────────────────────────────
  setCanister: (id: string, state: Partial<CanisterState>) => void;
  removeCanister: (id: string) => void;
  addConnection: (connection: OrganismConnection) => void;
  removeConnection: (fromId: string, toId: string) => void;
  updateMetrics: (metrics: Partial<Pick<NovaPlatformState, 'totalCycles' | 'totalMemory' | 'activeOrganisms' | 'systemHealth'>>) => void;
  selectCanister: (id: string | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  syncWithBackend: () => Promise<void>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  phiPriority: number;  // φ-weighted priority for display ordering
}

// ─── Fibonacci Threshold Transition Guard ────────────────────────────────────

/**
 * Returns true if the change magnitude exceeds the nearest Fibonacci threshold.
 * Used to prevent excessive state updates for small changes.
 */
export function shouldTransition(oldValue: number, newValue: number, minThreshold = 1): boolean {
  const delta = Math.abs(newValue - oldValue);
  const threshold = Math.max(nearestFib(Math.floor(delta)), minThreshold);
  return delta >= threshold;
}

// ─── Zustand Store Implementation ────────────────────────────────────────────

export const useNovaStore = create<NovaPlatformState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ─── Initial State ─────────────────────────────────────────────────────
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
        syncIntervalMs: Math.round(PHI * 1000),  // 1618ms

        // ─── Actions ───────────────────────────────────────────────────────────

        setCanister: (id, state) => set((draft) => {
          if (!draft.canisters[id]) {
            draft.canisters[id] = {
              id,
              name: state.name || id,
              status: 'dormant',
              elementClass: 'silver',
              cycleBalance: 0,
              memoryUsed: 0,
              lastUpdated: Date.now(),
              phiPriority: Object.keys(draft.canisters).length,
              ...state,
            };
          } else {
            Object.assign(draft.canisters[id], state, { lastUpdated: Date.now() });
          }
        }),

        removeCanister: (id) => set((draft) => {
          delete draft.canisters[id];
          draft.connections = draft.connections.filter(
            (c) => c.fromId !== id && c.toId !== id
          );
        }),

        addConnection: (connection) => set((draft) => {
          const existing = draft.connections.find(
            (c) => c.fromId === connection.fromId && c.toId === connection.toId
          );
          if (existing) {
            // Update signal strength only if change exceeds Fibonacci threshold
            if (shouldTransition(existing.signalStrength, connection.signalStrength, 0.01)) {
              existing.signalStrength = connection.signalStrength;
              existing.lastSignal = Date.now();
            }
          } else {
            draft.connections.push({ ...connection, lastSignal: Date.now() });
          }
        }),

        removeConnection: (fromId, toId) => set((draft) => {
          draft.connections = draft.connections.filter(
            (c) => !(c.fromId === fromId && c.toId === toId)
          );
        }),

        updateMetrics: (metrics) => set((draft) => {
          // Only update if changes exceed Fibonacci thresholds
          if (metrics.totalCycles !== undefined) {
            if (shouldTransition(draft.totalCycles, metrics.totalCycles, fib(8))) {
              draft.totalCycles = metrics.totalCycles;
            }
          }
          if (metrics.totalMemory !== undefined) {
            if (shouldTransition(draft.totalMemory, metrics.totalMemory, fib(5))) {
              draft.totalMemory = metrics.totalMemory;
            }
          }
          if (metrics.activeOrganisms !== undefined) {
            draft.activeOrganisms = metrics.activeOrganisms;
          }
          if (metrics.systemHealth !== undefined) {
            // Health updates always applied (critical metric)
            draft.systemHealth = metrics.systemHealth;
          }
        }),

        selectCanister: (id) => set((draft) => {
          draft.selectedCanisterId = id;
        }),

        toggleSidebar: () => set((draft) => {
          draft.sidebarOpen = !draft.sidebarOpen;
        }),

        setTheme: (theme) => set((draft) => {
          draft.theme = theme;
        }),

        addNotification: (notification) => set((draft) => {
          const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          draft.notifications.push({
            ...notification,
            id,
            timestamp: Date.now(),
            phiPriority: notification.type === 'error' ? 0 :
                         notification.type === 'warning' ? 1 :
                         notification.type === 'success' ? 2 : 3,
          });
          // Sort by φ-priority (lower = more important)
          draft.notifications.sort((a, b) => a.phiPriority - b.phiPriority);
          // Limit to Fibonacci(13) = 13 notifications
          if (draft.notifications.length > fib(13)) {
            draft.notifications = draft.notifications.slice(0, fib(13));
          }
        }),

        dismissNotification: (id) => set((draft) => {
          draft.notifications = draft.notifications.filter((n) => n.id !== id);
        }),

        syncWithBackend: async () => {
          const state = get();
          const now = Date.now();

          // Throttle syncs to φ-interval (1618ms)
          if (now - state.lastSyncTimestamp < state.syncIntervalMs) {
            return;
          }

          set((draft) => {
            draft.lastSyncTimestamp = now;
          });

          // TODO: Implement actual canister sync via ICP actors
          // This is a placeholder for the backend integration
          console.log('[NOVA] φ-sync triggered at', new Date(now).toISOString());
        },
      }))
    ),
    { name: 'nova-platform-store' }
  )
);

// ─── Selectors (φ-weighted) ──────────────────────────────────────────────────

/** Select canisters sorted by φ-priority */
export const selectCanistersByPriority = (state: NovaPlatformState) =>
  Object.values(state.canisters).sort((a, b) =>
    phiWeight(a.phiPriority) - phiWeight(b.phiPriority)
  );

/** Select canisters by element class */
export const selectCanistersByElement = (elementClass: ElementClass) =>
  (state: NovaPlatformState) =>
    Object.values(state.canisters).filter((c) => c.elementClass === elementClass);

/** Select active canisters only */
export const selectActiveCanisters = (state: NovaPlatformState) =>
  Object.values(state.canisters).filter((c) => c.status === 'active');

/** Select connections for a specific canister */
export const selectCanisterConnections = (canisterId: string) =>
  (state: NovaPlatformState) =>
    state.connections.filter(
      (c) => c.fromId === canisterId || c.toId === canisterId
    );

/** Calculate aggregate system health (φ-weighted by element class) */
export const selectSystemHealthAggregate = (state: NovaPlatformState) => {
  const canisters = Object.values(state.canisters);
  if (canisters.length === 0) return 1;

  const elementWeights: Record<ElementClass, number> = {
    gold: phiWeight(2),     // Highest priority (immutable state)
    crimson: phiWeight(1),  // Medium priority (organism)
    silver: phiWeight(0),   // Standard priority (conductor)
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const canister of canisters) {
    const weight = elementWeights[canister.elementClass];
    const health = canister.status === 'active' ? 1 :
                   canister.status === 'initializing' ? 0.5 :
                   canister.status === 'migrating' ? 0.7 :
                   canister.status === 'error' ? 0 : 0.3;
    weightedSum += health * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 1;
};

export default useNovaStore;
