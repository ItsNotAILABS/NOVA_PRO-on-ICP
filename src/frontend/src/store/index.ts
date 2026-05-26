/**
 * NOVA Platform — Store Index
 *
 * Re-exports all state management utilities.
 * Casa de Medina — Architectos de Architectura Inteligente
 */

// Zustand store
export {
  useNovaStore,
  type NovaPlatformState,
  type CanisterState,
  type CanisterStatus,
  type ElementClass,
  type OrganismConnection,
  type Notification,
  // φ-Mathematics utilities
  PHI,
  PHI_INV,
  fib,
  nearestFib,
  phiWeight,
  phiWeightDepth,
  shouldTransition,
  // Selectors
  selectCanistersByPriority,
  selectCanistersByElement,
  selectActiveCanisters,
  selectCanisterConnections,
  selectSystemHealthAggregate,
} from './nova-store';

// XState canister lifecycle
export {
  canisterLifecycleMachine,
  type CanisterContext,
  type CanisterEvent,
  type CanisterState as CanisterMachineState,
  CANISTER_STATES,
  getElementClassForState,
} from './canister-machine';

// React Query
export {
  queryClient,
  NovaQueryProvider,
  queryKeys,
  FIB_INTERVALS,
  QUERY_LIMITS,
  calculateQueryCost,
  validateQueryComplexity,
  type QueryStructure,
  // Hooks
  useCanisterStatus,
  useSystemMetrics,
  useCanisterList,
  useOrganismConnections,
  useUpdateCanister,
  useMigrateCanister,
} from './query-client';
