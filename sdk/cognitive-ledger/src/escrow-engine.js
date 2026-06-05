///
/// @medina/cognitive-ledger — Escrow Engine
///
/// Atomic escrow settlement for third-party AI transactions.
///
/// Pattern:
///   1. Third-party AI locks tokens (proof-of-funds)
///   2. Guard validates, Scout routes to Worker
///   3. Worker processes task within deadline (F(11) = 89s)
///   4. On completion: tokens release to worker + receipt minted
///   5. On timeout: tokens refund to payer automatically
///
/// Streaming Micropayments (for long-running tasks):
///   - Split large tasks into φ-sized chunks
///   - Each chunk completes → partial release
///   - Remaining escrow covers outstanding work
///
/// Reputation / Bonding:
///   - Third parties bond tokens for higher trust/priority
///   - Bad inputs detected by Guard → bond slashed
///   - Good completions → reputation score increases (φ-weighted)
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import {
  PHI, PHI_INV, PHI_SQ, FIBONACCI,
  ESCROW_TIMEOUT_MS, ESCROW_STATUS, TRANSFER_FEE_E8S,
  PRIORITY_TIER, PRIORITY_MULTIPLIER, MIN_FEE,
  SURFACE, BEEHIVE_ROLE, ROLE_SURFACE_MAP,
} from './constants.js';

// ═══════════════════════════════════════════════════════════════════════════
//  ESCROW ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export class EscrowEngine {
  /**
   * @param {object} [opts]
   * @param {number} [opts.timeoutMs]      — override default escrow timeout
   * @param {number} [opts.maxPending]     — max concurrent escrows
   * @param {boolean} [opts.streamingEnabled] — enable micropayment streaming
   */
  constructor({
    timeoutMs        = ESCROW_TIMEOUT_MS,
    maxPending       = 100,
    streamingEnabled = false,
  } = {}) {
    this.timeoutMs        = timeoutMs;
    this.maxPending       = maxPending;
    this.streamingEnabled = streamingEnabled;
    this.birthTime        = Date.now();

    // Escrow state
    this._escrows     = new Map();   // escrowId → EscrowRecord
    this._nextId      = 0;

    // Reputation tracking
    this._reputation  = new Map();   // principalId → { score, completions, slashes, bonded }

    // Revenue metrics
    this._metrics     = {
      totalLocked:    0,
      totalReleased:  0,
      totalRefunded:  0,
      totalSlashed:   0,
      feesCollected:  0,
      escrowsCreated: 0,
      escrowsSettled: 0,
    };

    console.log(`💰 EscrowEngine born | timeout=${timeoutMs}ms | streaming=${streamingEnabled}`);
  }

  // ─── Create Escrow (Lock Funds) ─────────────────────────────────────────

  /**
   * Lock tokens for a cognitive task.
   *
   * @param {object} params
   * @param {string}   params.payer       — principal of the payer
   * @param {number}   params.amount      — NOVA tokens to lock (e8s)
   * @param {string}   params.taskHash    — hash of task specification
   * @param {string}   params.priority    — PRIORITY_TIER value
   * @param {string}   [params.worker]    — assigned worker (or '' for auto-route)
   * @returns {{ ok: boolean, escrowId?: number, error?: string }}
   */
  lock(params) {
    const { payer, amount, taskHash, priority = PRIORITY_TIER.STANDARD, worker = '' } = params;

    // Validate minimum fee
    const minFee = MIN_FEE[priority] || MIN_FEE.STANDARD;
    if (amount < minFee) {
      return { ok: false, error: `Insufficient: ${amount} < ${minFee} e8s for ${priority}` };
    }

    // Capacity check
    const pendingCount = this._countPending();
    if (pendingCount >= this.maxPending) {
      return { ok: false, error: `At capacity: ${pendingCount}/${this.maxPending} pending` };
    }

    const now = Date.now();
    const escrowId = this._nextId++;
    const deadline = now + this.timeoutMs;

    const record = {
      id:          escrowId,
      payer,
      worker,
      amount,
      taskHash,
      priority,
      status:      ESCROW_STATUS.LOCKED,
      createdAt:   now,
      deadline,
      resultHash:  null,
      releasedAt:  null,
      chunks:      [],  // For streaming micropayments
    };

    this._escrows.set(escrowId, record);
    this._metrics.totalLocked += amount;
    this._metrics.escrowsCreated++;
    this._metrics.feesCollected += TRANSFER_FEE_E8S;

    console.log(`   Escrow locked | id=${escrowId} | ${amount} e8s | deadline=${new Date(deadline).toISOString()}`);
    return { ok: true, escrowId, deadline };
  }

  // ─── Assign Worker ──────────────────────────────────────────────────────

  /**
   * Assign a worker to a locked escrow and transition to PROCESSING.
   */
  assignWorker(escrowId, worker) {
    const esc = this._escrows.get(escrowId);
    if (!esc) return { ok: false, error: 'Escrow not found' };
    if (esc.status !== ESCROW_STATUS.LOCKED) return { ok: false, error: `Cannot assign: status=${esc.status}` };

    esc.worker = worker;
    esc.status = ESCROW_STATUS.PROCESSING;
    return { ok: true, escrowId, worker };
  }

  // ─── Complete Task ──────────────────────────────────────────────────────

  /**
   * Worker signals task completion with result hash.
   * Transitions escrow to COMPLETED (awaiting payer release).
   */
  complete(escrowId, resultHash, fidelityScore = 1.0) {
    const esc = this._escrows.get(escrowId);
    if (!esc) return { ok: false, error: 'Escrow not found' };

    if (esc.status !== ESCROW_STATUS.LOCKED && esc.status !== ESCROW_STATUS.PROCESSING) {
      return { ok: false, error: `Cannot complete: status=${esc.status}` };
    }

    const now = Date.now();
    if (now > esc.deadline) {
      esc.status = ESCROW_STATUS.REFUNDED;
      this._metrics.totalRefunded += esc.amount;
      return { ok: false, error: 'Deadline exceeded — auto-refunded' };
    }

    esc.status     = ESCROW_STATUS.COMPLETED;
    esc.resultHash = resultHash;
    esc.fidelity   = fidelityScore;

    console.log(`   Escrow completed | id=${escrowId} | result=${resultHash.slice(0,16)}...`);
    return { ok: true, escrowId, resultHash, fidelityScore };
  }

  // ─── Release (Settle) ───────────────────────────────────────────────────

  /**
   * Release escrowed funds to worker. Called by payer after verifying result.
   * Implements atomic settlement: funds transfer + receipt generation.
   *
   * @returns {{ ok: boolean, receipt?: object, error?: string }}
   */
  release(escrowId) {
    const esc = this._escrows.get(escrowId);
    if (!esc) return { ok: false, error: 'Escrow not found' };
    if (esc.status !== ESCROW_STATUS.COMPLETED) {
      return { ok: false, error: `Cannot release: status=${esc.status}` };
    }

    const now = Date.now();
    esc.status     = ESCROW_STATUS.RELEASED;
    esc.releasedAt = now;

    this._metrics.totalReleased += esc.amount;
    this._metrics.escrowsSettled++;

    // Update worker reputation
    this._updateReputation(esc.worker, true, esc.fidelity || 1.0);

    // Generate settlement receipt
    const receipt = {
      escrowId,
      payer:       esc.payer,
      worker:      esc.worker,
      amount:      esc.amount,
      taskHash:    esc.taskHash,
      resultHash:  esc.resultHash,
      fidelity:    esc.fidelity || 1.0,
      settledAt:   now,
      duration:    now - esc.createdAt,
      fee:         TRANSFER_FEE_E8S,
      receiptHash: this._hashReceipt(esc),
    };

    console.log(`   Escrow released | id=${escrowId} | ${esc.amount} e8s → ${esc.worker}`);
    return { ok: true, receipt };
  }

  // ─── Refund (Timeout or Failure) ────────────────────────────────────────

  /**
   * Refund escrowed funds to payer.
   * Called on timeout, worker failure, or by governance.
   */
  refund(escrowId, reason = 'timeout') {
    const esc = this._escrows.get(escrowId);
    if (!esc) return { ok: false, error: 'Escrow not found' };

    if (esc.status === ESCROW_STATUS.RELEASED) return { ok: false, error: 'Already released' };
    if (esc.status === ESCROW_STATUS.REFUNDED) return { ok: false, error: 'Already refunded' };

    esc.status     = ESCROW_STATUS.REFUNDED;
    esc.releasedAt = Date.now();

    this._metrics.totalRefunded += esc.amount;

    // Slash worker reputation if they failed
    if (esc.worker && reason !== 'payer_cancel') {
      this._updateReputation(esc.worker, false, 0);
    }

    return { ok: true, escrowId, refunded: esc.amount, reason };
  }

  // ─── Streaming Micropayments ────────────────────────────────────────────

  /**
   * Release a partial chunk of the escrow (for long-running tasks).
   * Chunk sizes follow φ-ratio: first chunk = amount/φ², second = remainder/φ², etc.
   */
  releaseChunk(escrowId, chunkResult) {
    if (!this.streamingEnabled) {
      return { ok: false, error: 'Streaming not enabled' };
    }

    const esc = this._escrows.get(escrowId);
    if (!esc) return { ok: false, error: 'Escrow not found' };
    if (esc.status !== ESCROW_STATUS.PROCESSING) {
      return { ok: false, error: `Cannot stream: status=${esc.status}` };
    }

    // Calculate chunk size: φ-weighted diminishing portions
    const released = esc.chunks.reduce((s, c) => s + c.amount, 0);
    const remaining = esc.amount - released;
    if (remaining <= 0) {
      return { ok: false, error: 'No remaining funds to stream' };
    }

    // Chunk = remaining / φ² (golden-ratio diminishing)
    const chunkAmount = Math.max(
      TRANSFER_FEE_E8S,
      Math.floor(remaining / PHI_SQ)
    );

    const chunk = {
      index:      esc.chunks.length,
      amount:     chunkAmount,
      resultHash: chunkResult,
      timestamp:  Date.now(),
    };
    esc.chunks.push(chunk);
    this._metrics.totalReleased += chunkAmount;

    console.log(`   Escrow chunk | id=${escrowId} | chunk=${chunk.index} | ${chunkAmount} e8s`);
    return { ok: true, escrowId, chunk, remaining: remaining - chunkAmount };
  }

  // ─── Reputation / Bonding ───────────────────────────────────────────────

  /**
   * Bond tokens for higher priority access.
   * Bonded workers get priority routing and higher trust.
   */
  bond(principalId, amount) {
    const rep = this._getReputation(principalId);
    rep.bonded += amount;
    this._reputation.set(principalId, rep);
    return { ok: true, principalId, totalBonded: rep.bonded, score: rep.score };
  }

  /**
   * Slash a worker's bond for bad behavior (detected by Guard).
   * Slash amount = bond × (1/φ) per infraction.
   */
  slash(principalId, reason) {
    const rep = this._getReputation(principalId);
    const slashAmount = Math.floor(rep.bonded * PHI_INV);
    rep.bonded -= slashAmount;
    rep.slashes++;
    rep.score = Math.max(0, rep.score - PHI_INV);
    this._reputation.set(principalId, rep);
    this._metrics.totalSlashed += slashAmount;

    console.warn(`⚠️  Slash | ${principalId} | -${slashAmount} e8s | reason=${reason}`);
    return { ok: true, principalId, slashed: slashAmount, newBond: rep.bonded, reason };
  }

  /**
   * Get reputation for a principal.
   */
  getReputation(principalId) {
    return this._getReputation(principalId);
  }

  // ─── Timeout Sweep ──────────────────────────────────────────────────────

  /**
   * Sweep expired escrows and auto-refund.
   * Called periodically (matches canister heartbeat).
   */
  sweepExpired() {
    const now = Date.now();
    const expired = [];

    for (const [id, esc] of this._escrows) {
      if ((esc.status === ESCROW_STATUS.LOCKED || esc.status === ESCROW_STATUS.PROCESSING) &&
          now > esc.deadline) {
        this.refund(id, 'timeout');
        expired.push(id);
      }
    }

    return { swept: expired.length, ids: expired };
  }

  // ─── Diagnostics ────────────────────────────────────────────────────────

  getStatus() {
    return {
      uptime:         Date.now() - this.birthTime,
      pending:        this._countPending(),
      metrics:        { ...this._metrics },
      streaming:      this.streamingEnabled,
      timeout:        this.timeoutMs,
      maxPending:     this.maxPending,
    };
  }

  getEscrow(escrowId) {
    return this._escrows.get(escrowId) || null;
  }

  // ─── Internal Helpers ───────────────────────────────────────────────────

  _countPending() {
    let count = 0;
    for (const [, esc] of this._escrows) {
      if (esc.status === ESCROW_STATUS.LOCKED || esc.status === ESCROW_STATUS.PROCESSING) {
        count++;
      }
    }
    return count;
  }

  _getReputation(principalId) {
    if (!this._reputation.has(principalId)) {
      this._reputation.set(principalId, {
        principalId,
        score:       PHI_INV,   // Start at emergence threshold
        completions: 0,
        slashes:     0,
        bonded:      0,
      });
    }
    return this._reputation.get(principalId);
  }

  _updateReputation(principalId, success, fidelity) {
    const rep = this._getReputation(principalId);
    if (success) {
      rep.completions++;
      // φ-weighted reputation growth: score += (1 - score) × fidelity / φ
      rep.score = Math.min(1.0, rep.score + (1.0 - rep.score) * fidelity / PHI);
    } else {
      rep.slashes++;
      rep.score = Math.max(0, rep.score - PHI_INV * 0.1);
    }
    this._reputation.set(principalId, rep);
  }

  _hashReceipt(esc) {
    const data = `${esc.id}|${esc.payer}|${esc.worker}|${esc.amount}|${esc.taskHash}|${esc.resultHash}`;
    let h = 5381;
    for (let i = 0; i < data.length; i++) {
      h = ((h * 33) + data.charCodeAt(i)) >>> 0;
    }
    return h.toString(16);
  }
}

export default { EscrowEngine };
