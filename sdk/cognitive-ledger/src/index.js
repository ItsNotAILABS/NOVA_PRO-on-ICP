///
/// @medina/cognitive-ledger — Third-Party AI Transaction SDK
///
/// Simple API for external AIs to transact with the NOVA cognitive economy.
///
/// Core functions:
///   submit_task(payload, payment)     → routes through Scout/Guard → Worker → result + receipt
///   query_provenance(cognitive_id)    → returns full Source→Nexus trace
///   get_escrow_status(escrow_id)      → escrow state and timeline
///   bond(amount)                      → stake for priority access
///
/// Transaction flow:
///   1. External AI calls submit_task with proof-of-funds
///   2. Guard engine validates payload integrity
///   3. Scout engine routes to appropriate Worker (beehive role assignment)
///   4. Worker processes within F(11) = 89s deadline
///   5. Nexus registers outcome + receipt minted
///   6. Escrow releases payment to worker
///
/// Interoperability:
///   - Standard JSON task specifications
///   - ICRC-1 token payments
///   - Cross-ledger bridge support (ICP ↔ Bitcoin/Ethereum via ICP integrations)
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import {
  PHI, PHI_INV, PHI_SQ, FIBONACCI,
  TRANSFER_FEE_E8S, ESCROW_TIMEOUT_MS,
  SURFACE, SURFACE_PRIORITY,
  PRIORITY_TIER, PRIORITY_MULTIPLIER, MIN_FEE,
  ESCROW_STATUS, BEEHIVE_ROLE, ROLE_SURFACE_MAP,
  TX_TEMPLATE, CANISTER_IDS,
} from './constants.js';

import { EscrowEngine } from './escrow-engine.js';

// ═══════════════════════════════════════════════════════════════════════════
//  COGNITIVE LEDGER CLIENT
// ═══════════════════════════════════════════════════════════════════════════

export class CognitiveLedgerClient {
  /**
   * @param {object} [opts]
   * @param {string}   [opts.principalId]     — caller's ICP principal
   * @param {object}   [opts.canisterIds]     — override canister IDs
   * @param {boolean}  [opts.streaming]       — enable micropayment streaming
   * @param {Function} [opts.icpAgent]        — ICP agent for canister calls
   */
  constructor({
    principalId     = '',
    canisterIds     = {},
    streaming       = false,
    icpAgent        = null,
  } = {}) {
    this.principalId  = principalId;
    this.canisterIds  = { ...CANISTER_IDS, ...canisterIds };
    this.icpAgent     = icpAgent;
    this.birthTime    = Date.now();

    // Local escrow engine (mirrors on-chain state)
    this._escrow = new EscrowEngine({ streamingEnabled: streaming });

    // Transaction log (local cache)
    this._txLog = [];

    console.log(`🧠 CognitiveLedgerClient | principal=${principalId || 'anonymous'}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PRIMARY API — submit_task
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Submit a cognitive task with payment.
   * This is the main entry point for third-party AI transactions.
   *
   * @param {object}  payload         — task specification
   * @param {string}    payload.type    — task type (e.g., 'inference', 'transform', 'classify')
   * @param {string}    payload.input   — input data (text, JSON, etc.)
   * @param {object}    [payload.config]— task-specific configuration
   * @param {object}  payment
   * @param {number}    payment.amount  — NOVA tokens to pay (e8s)
   * @param {string}    [payment.priority] — PRIORITY_TIER value
   * @param {string}    [payment.memo]     — optional memo
   * @param {number}    [payment.lineageRef] — parent cognitive ID for lineage
   * @returns {Promise<{ ok: boolean, result?: TaskResult, error?: string }>}
   */
  async submit_task(payload, payment = {}) {
    const {
      amount      = MIN_FEE.STANDARD,
      priority    = PRIORITY_TIER.STANDARD,
      memo        = '',
      lineageRef  = null,
    } = payment;

    // Validate payload
    if (!payload || !payload.type || !payload.input) {
      return { ok: false, error: 'Invalid payload: requires { type, input }' };
    }

    // Validate payment meets minimum
    const minFee = MIN_FEE[priority] || MIN_FEE.STANDARD;
    if (amount < minFee) {
      return { ok: false, error: `Insufficient payment: ${amount} < ${minFee} e8s for ${priority}` };
    }

    // Create task specification (standard JSON format)
    const taskSpec = {
      type:        payload.type,
      input:       payload.input,
      config:      payload.config || {},
      priority,
      timestamp:   Date.now(),
      caller:      this.principalId,
      lineageRef,
    };

    const taskHash = this._hash(JSON.stringify(taskSpec));

    // Lock escrow locally
    const escrowResult = this._escrow.lock({
      payer:    this.principalId,
      amount,
      taskHash,
      priority,
    });

    if (!escrowResult.ok) {
      return { ok: false, error: escrowResult.error };
    }

    // If we have an ICP agent, submit to canister
    if (this.icpAgent && this.canisterIds.COGNITIVE_LEDGER) {
      try {
        const result = await this._callCanister('submit_task', {
          payload:       JSON.stringify(taskSpec),
          paymentAmount: amount,
          priority:      { [priority]: null },  // Motoko variant encoding
          memo,
          lineageRef:    lineageRef ? [lineageRef] : [],  // Motoko opt encoding
        });
        this._logTx(TX_TEMPLATE.COGNITIVE_TRANSFORM, { taskHash, escrowId: escrowResult.escrowId, result });
        return { ok: true, result, escrowId: escrowResult.escrowId };
      } catch (err) {
        // Refund on submission failure
        this._escrow.refund(escrowResult.escrowId, 'submission_failed');
        return { ok: false, error: `Canister call failed: ${err.message}` };
      }
    }

    // Offline mode: return escrow receipt
    this._logTx(TX_TEMPLATE.ESCROW_LOCK, { taskHash, escrowId: escrowResult.escrowId });
    return {
      ok: true,
      escrowId:  escrowResult.escrowId,
      taskHash,
      deadline:  escrowResult.deadline,
      status:    'locked_pending_submission',
      note:      'No ICP agent configured — escrow locked locally. Connect agent to submit on-chain.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PRIMARY API — query_provenance
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Query the full Source→Nexus provenance trace for a cognitive record.
   *
   * @param {number} cognitiveId — the cognitive record ID
   * @returns {Promise<{ ok: boolean, trace?: ProvenanceTrace, error?: string }>}
   */
  async query_provenance(cognitiveId) {
    if (cognitiveId === undefined || cognitiveId === null) {
      return { ok: false, error: 'cognitiveId is required' };
    }

    // If we have an ICP agent, query the canister
    if (this.icpAgent && this.canisterIds.COGNITIVE_LEDGER) {
      try {
        const trace = await this._queryCanister('query_provenance', cognitiveId);
        this._logTx(TX_TEMPLATE.PROVENANCE_QUERY, { cognitiveId, trace });
        return { ok: true, trace };
      } catch (err) {
        return { ok: false, error: `Query failed: ${err.message}` };
      }
    }

    return { ok: false, error: 'No ICP agent configured — cannot query on-chain provenance' };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  SECONDARY API — Escrow Management
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get escrow status by ID.
   */
  get_escrow_status(escrowId) {
    const esc = this._escrow.getEscrow(escrowId);
    if (!esc) return { ok: false, error: 'Escrow not found' };
    return { ok: true, escrow: esc };
  }

  /**
   * Release escrow (confirm task completion and pay worker).
   */
  async release_escrow(escrowId) {
    const result = this._escrow.release(escrowId);
    if (!result.ok) return result;

    // On-chain release
    if (this.icpAgent && this.canisterIds.COGNITIVE_LEDGER) {
      try {
        await this._callCanister('release_escrow', escrowId);
      } catch (err) {
        // Local release succeeded; on-chain will catch up
        console.warn(`On-chain release pending: ${err.message}`);
      }
    }

    this._logTx(TX_TEMPLATE.ESCROW_RELEASE, { escrowId, receipt: result.receipt });
    return result;
  }

  /**
   * Bond tokens for priority access.
   */
  bond(amount) {
    const result = this._escrow.bond(this.principalId, amount);
    this._logTx(TX_TEMPLATE.GOVERNANCE_VOTE, { action: 'bond', amount });
    return result;
  }

  /**
   * Get reputation score for this principal (or another).
   */
  get_reputation(principalId = null) {
    return this._escrow.getReputation(principalId || this.principalId);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  TRANSACTION TEMPLATES — Pre-signed Intent Patterns
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Create a transaction template that can be pre-signed and executed later.
   * Allows external AIs to prepare workflows without deep integration.
   *
   * @param {string} templateType — TX_TEMPLATE value
   * @param {object} params       — template-specific parameters
   * @returns {{ template: object, signature: string }}
   */
  createTransactionTemplate(templateType, params = {}) {
    const template = {
      type:      templateType,
      params,
      caller:    this.principalId,
      timestamp: Date.now(),
      nonce:     Math.random().toString(36).slice(2),
      validFor:  ESCROW_TIMEOUT_MS,  // Template valid for F(11) = 89 seconds
    };

    const signature = this._hash(JSON.stringify(template));

    return { template, signature };
  }

  /**
   * Execute a pre-signed transaction template.
   */
  async executeTemplate(template, signature) {
    // Verify signature
    const expectedSig = this._hash(JSON.stringify(template));
    if (expectedSig !== signature) {
      return { ok: false, error: 'Invalid template signature' };
    }

    // Check expiry
    const age = Date.now() - template.timestamp;
    if (age > template.validFor) {
      return { ok: false, error: `Template expired: ${age}ms > ${template.validFor}ms` };
    }

    // Route to appropriate handler
    switch (template.type) {
      case TX_TEMPLATE.COGNITIVE_TRANSFORM:
        return this.submit_task(template.params.payload, template.params.payment);
      case TX_TEMPLATE.ESCROW_RELEASE:
        return this.release_escrow(template.params.escrowId);
      case TX_TEMPLATE.PROVENANCE_QUERY:
        return this.query_provenance(template.params.cognitiveId);
      default:
        return { ok: false, error: `Unknown template type: ${template.type}` };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  HEARTBEAT DASHBOARD — Colony Health API
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get colony health dashboard data.
   * Shows: pending txs, resource usage, escrow state, reputation.
   */
  getDashboard() {
    const escrowStatus = this._escrow.getStatus();
    return {
      principal:       this.principalId,
      uptime:          Date.now() - this.birthTime,
      escrow:          escrowStatus,
      reputation:      this.get_reputation(),
      txLogSize:       this._txLog.length,
      recentTxs:       this._txLog.slice(-10),
      canisterIds:     this.canisterIds,
      connected:       !!this.icpAgent,
    };
  }

  /**
   * Get economic metrics summary.
   */
  getEconomics() {
    const metrics = this._escrow.getStatus().metrics;
    return {
      ...metrics,
      netFlow:         metrics.totalReleased - metrics.totalRefunded,
      feeRevenue:      metrics.feesCollected,
      phiPremium:      PHI_SQ,  // Colony earns φ² premium on services
      settlementRate:  metrics.escrowsCreated > 0
        ? (metrics.escrowsSettled / metrics.escrowsCreated).toFixed(4)
        : '0.0000',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  INTERNAL HELPERS
  // ═══════════════════════════════════════════════════════════════════════

  async _callCanister(method, args) {
    if (!this.icpAgent) throw new Error('No ICP agent configured');
    // Placeholder for @dfinity/agent canister call
    // In production: return this.icpAgent.call(canisterId, method, args)
    throw new Error(`Canister call not implemented: ${method}`);
  }

  async _queryCanister(method, args) {
    if (!this.icpAgent) throw new Error('No ICP agent configured');
    // Placeholder for @dfinity/agent canister query
    throw new Error(`Canister query not implemented: ${method}`);
  }

  _hash(data) {
    let h = 5381;
    for (let i = 0; i < data.length; i++) {
      h = ((h * 33) + data.charCodeAt(i)) >>> 0;
    }
    return h.toString(16);
  }

  _logTx(type, data) {
    this._txLog.push({
      type,
      data,
      timestamp: Date.now(),
      principal: this.principalId,
    });
    // Keep log bounded
    if (this._txLog.length > 1000) {
      this._txLog = this._txLog.slice(-500);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { EscrowEngine } from './escrow-engine.js';
export {
  PHI, PHI_INV, PHI_SQ,
  SURFACE, PRIORITY_TIER, ESCROW_STATUS,
  BEEHIVE_ROLE, ROLE_SURFACE_MAP, TX_TEMPLATE,
  MIN_FEE, TRANSFER_FEE_E8S, ESCROW_TIMEOUT_MS,
} from './constants.js';

export default {
  CognitiveLedgerClient,
  EscrowEngine,
};
