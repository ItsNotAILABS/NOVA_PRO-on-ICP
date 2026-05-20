///
/// RUNTIME INDEX — Unified Exports
///
/// Single entry point for the entire NATIVE NOVA PROTOCOL runtime system.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

// Core constants
export { PHI, GOLDEN_ANGLE, HEARTBEAT_MS, PHI_PHASE_OFFSET, EMERGENCE_THRESHOLD, KURAMOTO_COUPLING } from './native-runtime.js';

// Native runtime
export { runtime, NativeRuntime } from './native-runtime.js';
export type { SubstrateType, MiniHeart, MiniBrain, OrganismInstance, ProtocolContext } from './native-runtime.js';

// Alpha protocols
export { ALPHA_PROTOCOLS, getProtocol } from './alpha-protocols-201-220.js';
export type { AlphaProtocol } from './alpha-protocols-201-220.js';
export {
  PROTO_201, PROTO_202, PROTO_203, PROTO_204, PROTO_205,
  PROTO_206, PROTO_207, PROTO_208, PROTO_209, PROTO_210,
  PROTO_211, PROTO_212, PROTO_213, PROTO_214, PROTO_215,
  PROTO_216, PROTO_217, PROTO_218, PROTO_219, PROTO_220,
} from './alpha-protocols-201-220.js';

// Protocol binder
export { binder, ProtocolBinder } from './protocol-binder.js';
export type { ProtocolBinding, ProtocolRoute } from './protocol-binder.js';

// Bootstrap
export { bootstrap, shutdown, status, NOVA } from './bootstrap.js';

// ══════════════════════════════════════════════════════════════════
//  QUICK START
// ══════════════════════════════════════════════════════════════════

/**
 * Quick start the entire system:
 *
 * ```typescript
 * import { NOVA } from './runtime/index.js';
 *
 * await NOVA.bootstrap();
 * NOVA.status();
 * ```
 */
