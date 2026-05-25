/**
 * NOVA Platform — React Query with Fibonacci Revalidation
 *
 * Data fetching layer with φ-derived caching intervals and
 * Fibonacci-based stale-while-revalidate patterns.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ReactNode } from 'react';

// ─── φ-Mathematics Constants ─────────────────────────────────────────────────

const PHI = 1.6180339887498948482;

/** Fibonacci-based revalidation intervals (milliseconds) */
export const FIB_INTERVALS = {
  /** F(5) = 5 seconds — Fast refresh */
  FAST: 5 * 1000,
  /** F(8) = 8 seconds — Standard refresh */
  STANDARD: 8 * 1000,
  /** F(13) = 13 seconds — Slow refresh */
  SLOW: 13 * 1000,
  /** F(21) = 21 seconds — Lazy refresh */
  LAZY: 21 * 1000,
  /** F(34) = 34 seconds — Very lazy */
  VERY_LAZY: 34 * 1000,
  /** φ × 1000 = 1618ms — φ-interval */
  PHI: Math.round(PHI * 1000),
  /** F(55) = 55 seconds — Near-static */
  NEAR_STATIC: 55 * 1000,
  /** F(89) = 89 seconds — Effectively static */
  STATIC: 89 * 1000,
};

/** Query cost limits based on φ-depth */
export const QUERY_LIMITS = {
  /** Maximum depth for nested queries */
  MAX_DEPTH: 13,  // F(7)
  /** Maximum fields per query level */
  MAX_FIELDS_PER_LEVEL: 21,  // F(8)
  /** Maximum total query cost */
  MAX_COST: 144,  // F(12)
};

// ─── Query Client Configuration ──────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: F(8) = 8 seconds
      staleTime: FIB_INTERVALS.STANDARD,
      // Cache time: F(13) × 10 = 130 seconds (just over 2 minutes)
      gcTime: FIB_INTERVALS.SLOW * 10,
      // Retry with Fibonacci delays
      retry: 3,  // F(4)
      retryDelay: (attemptIndex) => {
        // Fibonacci delay: F(5), F(8), F(13) seconds
        const delays = [5000, 8000, 13000];
        return delays[Math.min(attemptIndex, delays.length - 1)];
      },
      // Refetch on window focus with φ-throttling
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      // Mutations retry with shorter Fibonacci delays
      retry: 2,  // F(3)
      retryDelay: (attemptIndex) => {
        const delays = [1000, 2000, 3000];  // F(1), F(2), F(3) seconds
        return delays[Math.min(attemptIndex, delays.length - 1)];
      },
    },
  },
});

// ─── Query Key Factories ─────────────────────────────────────────────────────

export const queryKeys = {
  // Canister queries
  canisters: {
    all: ['canisters'] as const,
    lists: () => [...queryKeys.canisters.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.canisters.lists(), filters] as const,
    details: () => [...queryKeys.canisters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.canisters.details(), id] as const,
    status: (id: string) => [...queryKeys.canisters.detail(id), 'status'] as const,
    cycles: (id: string) => [...queryKeys.canisters.detail(id), 'cycles'] as const,
    memory: (id: string) => [...queryKeys.canisters.detail(id), 'memory'] as const,
  },

  // Organism connections
  connections: {
    all: ['connections'] as const,
    list: () => [...queryKeys.connections.all, 'list'] as const,
    forCanister: (id: string) => [...queryKeys.connections.all, 'canister', id] as const,
  },

  // Platform metrics
  metrics: {
    all: ['metrics'] as const,
    system: () => [...queryKeys.metrics.all, 'system'] as const,
    cycles: () => [...queryKeys.metrics.all, 'cycles'] as const,
    health: () => [...queryKeys.metrics.all, 'health'] as const,
  },

  // User/Identity
  identity: {
    all: ['identity'] as const,
    principal: () => [...queryKeys.identity.all, 'principal'] as const,
    balance: () => [...queryKeys.identity.all, 'balance'] as const,
  },
};

// ─── φ-Weighted Query Cost Calculator ────────────────────────────────────────

/**
 * Calculate query cost using φ-depth weighting.
 * cost = Σ(field_count × φ^depth)
 */
export function calculateQueryCost(query: QueryStructure): number {
  function traverse(node: QueryStructure, depth: number): number {
    const fieldWeight = node.fields.length * Math.pow(PHI, depth);
    const childrenWeight = node.children.reduce(
      (sum, child) => sum + traverse(child, depth + 1),
      0
    );
    return fieldWeight + childrenWeight;
  }
  return traverse(query, 0);
}

export interface QueryStructure {
  fields: string[];
  children: QueryStructure[];
}

/**
 * Validate query complexity against limits.
 */
export function validateQueryComplexity(query: QueryStructure): {
  valid: boolean;
  cost: number;
  message?: string;
} {
  const cost = calculateQueryCost(query);

  if (cost > QUERY_LIMITS.MAX_COST) {
    return {
      valid: false,
      cost,
      message: `Query cost (${cost.toFixed(2)}) exceeds maximum (${QUERY_LIMITS.MAX_COST})`,
    };
  }

  // Check depth
  function maxDepth(node: QueryStructure, current: number): number {
    if (node.children.length === 0) return current;
    return Math.max(...node.children.map((c) => maxDepth(c, current + 1)));
  }

  const depth = maxDepth(query, 0);
  if (depth > QUERY_LIMITS.MAX_DEPTH) {
    return {
      valid: false,
      cost,
      message: `Query depth (${depth}) exceeds maximum (${QUERY_LIMITS.MAX_DEPTH})`,
    };
  }

  return { valid: true, cost };
}

// ─── Custom Hooks with Fibonacci Intervals ───────────────────────────────────

/**
 * Hook for canister status with fast refresh (F(5) = 5s).
 */
export function useCanisterStatus(canisterId: string) {
  return useQuery({
    queryKey: queryKeys.canisters.status(canisterId),
    queryFn: async () => {
      // TODO: Replace with actual ICP canister call
      return {
        id: canisterId,
        status: 'active' as const,
        cycleBalance: 1_000_000_000,
        memoryUsed: 100_000_000,
        lastUpdated: Date.now(),
      };
    },
    staleTime: FIB_INTERVALS.FAST,
    refetchInterval: FIB_INTERVALS.STANDARD,
  });
}

/**
 * Hook for system metrics with standard refresh (F(8) = 8s).
 */
export function useSystemMetrics() {
  return useQuery({
    queryKey: queryKeys.metrics.system(),
    queryFn: async () => {
      // TODO: Replace with actual ICP canister call
      return {
        totalCycles: 10_000_000_000,
        totalMemory: 1_000_000_000,
        activeOrganisms: 23,
        systemHealth: 0.95,
        timestamp: Date.now(),
      };
    },
    staleTime: FIB_INTERVALS.STANDARD,
    refetchInterval: FIB_INTERVALS.SLOW,
  });
}

/**
 * Hook for canister list with lazy refresh (F(21) = 21s).
 */
export function useCanisterList(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.canisters.list(filters || {}),
    queryFn: async () => {
      // TODO: Replace with actual ICP canister call
      return [
        { id: 'brain', name: 'Brain', status: 'active', elementClass: 'crimson' },
        { id: 'nexus', name: 'Nexus', status: 'active', elementClass: 'silver' },
        { id: 'nova_token', name: 'NOVA Token', status: 'active', elementClass: 'gold' },
      ];
    },
    staleTime: FIB_INTERVALS.LAZY,
    refetchInterval: FIB_INTERVALS.VERY_LAZY,
  });
}

/**
 * Hook for organism connections with slow refresh (F(13) = 13s).
 */
export function useOrganismConnections(canisterId?: string) {
  return useQuery({
    queryKey: canisterId
      ? queryKeys.connections.forCanister(canisterId)
      : queryKeys.connections.list(),
    queryFn: async () => {
      // TODO: Replace with actual ICP canister call
      return [
        { fromId: 'brain', toId: 'nexus', signalStrength: 0.95 },
        { fromId: 'nexus', toId: 'nova_token', signalStrength: 0.87 },
      ];
    },
    staleTime: FIB_INTERVALS.SLOW,
    refetchInterval: FIB_INTERVALS.LAZY,
  });
}

// ─── Mutation Hooks ──────────────────────────────────────────────────────────

/**
 * Mutation for updating canister state.
 */
export function useUpdateCanister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; status?: string; cycles?: number }) => {
      // TODO: Replace with actual ICP canister call
      console.log('[NOVA] Updating canister:', params);
      return { success: true, ...params };
    },
    onSuccess: (data) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.canisters.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.metrics.all });
    },
  });
}

/**
 * Mutation for triggering canister migration.
 */
export function useMigrateCanister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: string; targetVersion: number }) => {
      // TODO: Replace with actual ICP canister call
      console.log('[NOVA] Starting migration:', params);
      return { success: true, ...params };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.canisters.detail(data.id) });
    },
  });
}

// ─── Provider Component ──────────────────────────────────────────────────────

export function NovaQueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default NovaQueryProvider;
