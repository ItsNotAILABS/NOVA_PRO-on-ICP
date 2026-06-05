///
/// @medina/cognitive-ledger — Constants
///
/// Shared constants for the Cognitive Ledger SDK.
/// Aligns with the on-chain CognitiveLedger canister and thesis-alpha surfaces.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

// ═══════════════════════════════════════════════════════════════════════════
//  MATHEMATICAL CONSTANTS (φ-grounded)
// ═══════════════════════════════════════════════════════════════════════════

export const PHI          = 1.6180339887498948482;
export const PHI_INV      = 0.6180339887498948482;
export const PHI_SQ       = 2.6180339887498948482;
export const PHI_CB       = 4.2360679774997896964;
export const FIBONACCI    = [0,1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181];

// φ-derived heartbeat: 540 × φ ≈ 873ms
export const PHI_HEARTBEAT_MS = 873;

// ═══════════════════════════════════════════════════════════════════════════
//  LEDGER CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/// Transfer fee: 10_000 e8s (burned deflationary, matches nova_token)
export const TRANSFER_FEE_E8S = 10_000;

/// Escrow timeout: F(11) = 89 seconds (Fibonacci)
export const ESCROW_TIMEOUT_S = 89;
export const ESCROW_TIMEOUT_MS = 89_000;

/// Maximum pending escrows before rate limiting
export const MAX_PENDING_ESCROWS = 1000;

// ═══════════════════════════════════════════════════════════════════════════
//  SURFACES — Source / Forge / Deploy / Nexus
// ═══════════════════════════════════════════════════════════════════════════

export const SURFACE = {
  SOURCE: 'SOURCE',
  FORGE:  'FORGE',
  DEPLOY: 'DEPLOY',
  NEXUS:  'NEXUS',
};

export const SURFACE_DEPTH = {
  SOURCE: 0,
  FORGE:  1,
  DEPLOY: 2,
  NEXUS:  3,
};

/// φ-weighted priority per surface (higher depth = lower per-entry priority)
export const SURFACE_PRIORITY = {
  SOURCE: 1.0,
  FORGE:  PHI_INV,
  DEPLOY: PHI_INV * PHI_INV,
  NEXUS:  PHI_INV * PHI_INV * PHI_INV,
};

// ═══════════════════════════════════════════════════════════════════════════
//  PRIORITY TIERS (φ-weighted fee multipliers)
// ═══════════════════════════════════════════════════════════════════════════

export const PRIORITY_TIER = {
  FREE:     'FREE',
  STANDARD: 'STANDARD',
  PRIORITY: 'PRIORITY',
  CRITICAL: 'CRITICAL',
};

export const PRIORITY_MULTIPLIER = {
  FREE:     1.0,
  STANDARD: PHI,
  PRIORITY: PHI_SQ,
  CRITICAL: PHI_CB,
};

/// Minimum fee per priority tier (e8s)
export const MIN_FEE = {
  FREE:     TRANSFER_FEE_E8S,
  STANDARD: Math.round(TRANSFER_FEE_E8S * PHI),
  PRIORITY: Math.round(TRANSFER_FEE_E8S * PHI_SQ),
  CRITICAL: Math.round(TRANSFER_FEE_E8S * PHI_CB),
};

// ═══════════════════════════════════════════════════════════════════════════
//  ESCROW STATES
// ═══════════════════════════════════════════════════════════════════════════

export const ESCROW_STATUS = {
  LOCKED:     'LOCKED',
  PROCESSING: 'PROCESSING',
  COMPLETED:  'COMPLETED',
  RELEASED:   'RELEASED',
  REFUNDED:   'REFUNDED',
  DISPUTED:   'DISPUTED',
};

// ═══════════════════════════════════════════════════════════════════════════
//  BEEHIVE ROLE MAPPING (castes → cognitive roles)
// ═══════════════════════════════════════════════════════════════════════════

export const BEEHIVE_ROLE = {
  QUEEN:   'QUEEN',    // Sovereign governance
  SCOUT:   'SCOUT',    // Task routing, discovery
  GUARD:   'GUARD',    // Validation, defense
  NURSE:   'NURSE',    // Memory consolidation (days 1-12)
  HOUSE:   'HOUSE',    // Reasoning pipelines (days 12-20)
  FORAGER: 'FORAGER',  // External API calls (days 20-45)
  DRONE:   'DRONE',    // Exploratory testing
};

/// Map beehive roles to lifecycle surfaces
export const ROLE_SURFACE_MAP = {
  SCOUT:   SURFACE.SOURCE,   // Scouts classify and route
  GUARD:   SURFACE.SOURCE,   // Guards validate at entry
  NURSE:   SURFACE.FORGE,    // Nurses consolidate in forge
  HOUSE:   SURFACE.FORGE,    // House workers reason in forge
  FORAGER: SURFACE.DEPLOY,   // Foragers execute externally
  DRONE:   SURFACE.DEPLOY,   // Drones test deployments
  QUEEN:   SURFACE.NEXUS,    // Queen governs the registry
};

// ═══════════════════════════════════════════════════════════════════════════
//  TRANSACTION TEMPLATES (pre-signed intent patterns)
// ═══════════════════════════════════════════════════════════════════════════

export const TX_TEMPLATE = {
  COGNITIVE_TRANSFORM:    'cognitive_transform',
  ESCROW_LOCK:            'escrow_lock',
  ESCROW_RELEASE:         'escrow_release',
  ESCROW_REFUND:          'escrow_refund',
  PROVENANCE_QUERY:       'provenance_query',
  PROOF_COMMIT:           'proof_commit',
  LINEAGE_LINK:           'lineage_link',
  SERVICE_CREDIT_MINT:    'service_credit_mint',
  GOVERNANCE_VOTE:        'governance_vote',
};

// ═══════════════════════════════════════════════════════════════════════════
//  CANISTER IDS (mainnet placeholders)
// ═══════════════════════════════════════════════════════════════════════════

export const CANISTER_IDS = {
  COGNITIVE_LEDGER: null,  // Set after deployment
  NOVA_TOKEN:       null,  // Set after deployment
  CYCLES_MARKET:    null,  // Set after deployment
  NNS_PROXY:        null,  // Set after deployment
  CPL_RUNTIME:      null,  // Set after deployment
};

export default {
  PHI, PHI_INV, PHI_SQ, PHI_CB, FIBONACCI,
  PHI_HEARTBEAT_MS, TRANSFER_FEE_E8S,
  ESCROW_TIMEOUT_S, ESCROW_TIMEOUT_MS, MAX_PENDING_ESCROWS,
  SURFACE, SURFACE_DEPTH, SURFACE_PRIORITY,
  PRIORITY_TIER, PRIORITY_MULTIPLIER, MIN_FEE,
  ESCROW_STATUS, BEEHIVE_ROLE, ROLE_SURFACE_MAP,
  TX_TEMPLATE, CANISTER_IDS,
};
