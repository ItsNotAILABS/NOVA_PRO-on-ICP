///
/// @medina/cognitive-ledger — CloudColony Client
///
/// SDK for interacting with the six-engine CloudColony canister.
/// Provides a high-level interface for the biomimetic task pipeline:
///
///   Scout → Guard → Worker → Builder → Memory → Governance
///
/// The colony is a living organism. Each engine is a specialized caste:
///   Worker     → Task execution & generation (foragers)
///   Scout      → Signal monitoring & opportunity detection (explorers)
///   Guard      → Threat validation & filtering (defenders)
///   Builder    → Infrastructure expansion (architects)
///   Memory     → State preservation & identity (hive mind)
///   Governance → Conflict resolution & resource policy (queen + collective)
///
/// Inter-engine communication uses "pheromone signals" — typed messages
/// with strength decay, priority weighting, and broadcast/unicast targeting.
///
/// Casa de Medina — Architectos de Architectura Inteligente
///

import {
  PHI, PHI_INV, PHI_SQ, PHI_CB, FIBONACCI,
  SURFACE, BEEHIVE_ROLE, ROLE_SURFACE_MAP,
  PRIORITY_TIER, PRIORITY_MULTIPLIER,
  ESCROW_TIMEOUT_MS,
} from './constants.js';

// ═══════════════════════════════════════════════════════════════════════════
//  PHEROMONE TYPES (inter-engine communication protocol)
// ═══════════════════════════════════════════════════════════════════════════

export const PHEROMONE_TYPE = {
  TASK_AVAILABLE:     'TaskAvailable',
  THREAT_DETECTED:    'ThreatDetected',
  RESOURCE_LOW:       'ResourceLow',
  BUILD_REQUEST:      'BuildRequest',
  CONSENSUS_NEEDED:   'ConsensusNeeded',
  MEMORY_COMMIT:      'MemoryCommit',
  OPPORTUNITY_FOUND:  'OpportunityFound',
  SWARM_TRIGGER:      'SwarmTrigger',
  QUEEN_SIGNAL:       'QueenSignal',
  DANCE_WAGGLE:       'DanceWaggle',
};

export const ENGINE_CASTE = {
  WORKER:     'Worker',
  SCOUT:      'Scout',
  GUARD:      'Guard',
  BUILDER:    'Builder',
  MEMORY:     'Memory',
  GOVERNANCE: 'Governance',
};

export const TASK_STATUS = {
  QUEUED:     'Queued',
  SCOUTING:   'Scouting',
  GUARDING:   'Guarding',
  WORKING:    'Working',
  BUILDING:   'Building',
  COMMITTING: 'Committing',
  GOVERNED:   'Governed',
  COMPLETED:  'Completed',
  REJECTED:   'Rejected',
};

// ═══════════════════════════════════════════════════════════════════════════
//  CLOUD COLONY CLIENT
// ═══════════════════════════════════════════════════════════════════════════

export class CloudColonyClient {
  /**
   * @param {object} [opts]
   * @param {string}   [opts.colonyId]       — colony identifier
   * @param {string}   [opts.principalId]    — caller's ICP principal
   * @param {object}   [opts.canisterId]     — cloud_colony canister ID
   * @param {Function} [opts.icpAgent]       — ICP agent for canister calls
   */
  constructor({
    colonyId    = 'CLOUD_COLONY_ALPHA',
    principalId = '',
    canisterId  = null,
    icpAgent    = null,
  } = {}) {
    this.colonyId    = colonyId;
    this.principalId = principalId;
    this.canisterId  = canisterId;
    this.icpAgent    = icpAgent;
    this.birthTime   = Date.now();

    // Local pheromone trail (mirrors on-chain state)
    this._pheromoneTrail = [];
    this._taskLog        = [];
    this._colonyState    = this._defaultColonyState();

    console.log(`🐝 CloudColonyClient | colony=${colonyId} | principal=${principalId || 'anonymous'}`);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  HIGH-LEVEL API — Full Pipeline
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Submit work through the full colony pipeline:
   *   Scout (classify) → Guard (validate) → Worker (execute) → Memory (persist)
   *
   * @param {object}  task
   * @param {string}    task.type     — task type (e.g., 'inference', 'transform')
   * @param {string}    task.payload  — task data
   * @param {number}    [task.priority] — priority score [0, φ³]
   * @returns {{ ok: boolean, taskId?: number, pipeline?: object, error?: string }}
   */
  async submitWork(task) {
    const { type, payload, priority = PHI_INV } = task;

    if (!type || !payload) {
      return { ok: false, error: 'Task requires { type, payload }' };
    }

    const taskId = this._taskLog.length;
    const now    = Date.now();

    // ─── Step 1: Scout (SOURCE surface) ────────────────────────────
    const scoutResult = this._scoutClassify(taskId, type, payload, priority);
    this._emitLocalPheromone(ENGINE_CASTE.SCOUT, ENGINE_CASTE.GUARD,
      PHEROMONE_TYPE.OPPORTUNITY_FOUND, { taskId, type, priority });

    // ─── Step 2: Guard (SOURCE surface) ────────────────────────────
    const guardResult = this._guardValidate(taskId, payload, priority);
    if (!guardResult.passed) {
      this._emitLocalPheromone(ENGINE_CASTE.GUARD, null,
        PHEROMONE_TYPE.THREAT_DETECTED, { taskId, reason: guardResult.reason });
      return { ok: false, error: `Guard rejected: ${guardResult.reason}`, taskId };
    }
    this._emitLocalPheromone(ENGINE_CASTE.GUARD, ENGINE_CASTE.WORKER,
      PHEROMONE_TYPE.TASK_AVAILABLE, { taskId, validated: true });

    // ─── Step 3: Worker (FORGE surface) — awaiting execution ───────
    const pipelineState = {
      taskId,
      type,
      priority,
      surfaces:   [SURFACE.SOURCE, SURFACE.FORGE],
      status:     TASK_STATUS.WORKING,
      scoutedAt:  now,
      validatedAt: Date.now(),
      assignedTo: ENGINE_CASTE.WORKER,
    };

    this._taskLog.push({
      ...pipelineState,
      payload,
      timestamp: now,
    });

    // If we have an ICP agent, submit to canister
    if (this.icpAgent && this.canisterId) {
      try {
        const result = await this._callCanister('scout_ingest', [type, payload, priority]);
        pipelineState.canisterTaskId = result;
      } catch (err) {
        pipelineState.note = `Local pipeline active; canister call pending: ${err.message}`;
      }
    }

    return { ok: true, taskId, pipeline: pipelineState };
  }

  /**
   * Complete a task (Worker result submission).
   * Triggers Memory commit and advances to DEPLOY/NEXUS surface.
   */
  async completeWork(taskId, resultData, cyclesUsed = 0) {
    if (taskId >= this._taskLog.length) {
      return { ok: false, error: 'Task not found' };
    }

    const task = this._taskLog[taskId];
    task.status      = TASK_STATUS.COMPLETED;
    task.resultHash  = this._hash(resultData);
    task.completedAt = Date.now();
    task.cyclesUsed  = cyclesUsed;
    task.surfaces.push(SURFACE.DEPLOY, SURFACE.NEXUS);

    // Emit: memory commit signal
    this._emitLocalPheromone(ENGINE_CASTE.WORKER, ENGINE_CASTE.MEMORY,
      PHEROMONE_TYPE.MEMORY_COMMIT, { taskId, resultHash: task.resultHash, cyclesUsed });

    // On-chain submission
    if (this.icpAgent && this.canisterId && task.canisterTaskId !== undefined) {
      try {
        await this._callCanister('worker_execute', [task.canisterTaskId, resultData, cyclesUsed]);
      } catch (err) {
        // Local completion succeeded; canister sync deferred
      }
    }

    return { ok: true, taskId, resultHash: task.resultHash, surfaces: task.surfaces };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  ENGINE-SPECIFIC API
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Scout: Manually ingest a signal for classification.
   */
  scoutIngest(signalType, payload, priority = PHI_INV) {
    return this._scoutClassify(this._taskLog.length, signalType, payload, priority);
  }

  /**
   * Guard: Manually validate a task.
   */
  guardValidate(taskId) {
    if (taskId >= this._taskLog.length) return { passed: false, reason: 'Task not found' };
    const task = this._taskLog[taskId];
    return this._guardValidate(taskId, task.payload, task.priority);
  }

  /**
   * Builder: Request infrastructure expansion.
   */
  builderExpand(expansionType, specification) {
    this._emitLocalPheromone(ENGINE_CASTE.BUILDER, ENGINE_CASTE.GOVERNANCE,
      PHEROMONE_TYPE.BUILD_REQUEST, { expansionType, specification });
    this._emitLocalPheromone(ENGINE_CASTE.BUILDER, ENGINE_CASTE.GOVERNANCE,
      PHEROMONE_TYPE.CONSENSUS_NEEDED, { expansionType, requiresGovernance: true });
    return { ok: true, status: 'awaiting_governance', expansionType };
  }

  /**
   * Governance: Create a proposal.
   */
  governancePropose(description, proposerCaste = ENGINE_CASTE.GOVERNANCE) {
    const proposalId = this._colonyState.proposals.length;
    const proposal = {
      id: proposalId,
      description,
      proposer:    proposerCaste,
      voteFor:     0,
      voteAgainst: 0,
      status:      'active',
      timestamp:   Date.now(),
    };
    this._colonyState.proposals.push(proposal);

    this._emitLocalPheromone(ENGINE_CASTE.GOVERNANCE, null,
      PHEROMONE_TYPE.QUEEN_SIGNAL, { proposalId, description });

    return { ok: true, proposalId, proposal };
  }

  /**
   * Governance: Vote on a proposal.
   * Quorum threshold: > 1/φ (61.8%) agreement.
   */
  governanceVote(proposalId, inFavor) {
    const prop = this._colonyState.proposals[proposalId];
    if (!prop) return { ok: false, error: 'Proposal not found' };
    if (prop.status !== 'active') return { ok: false, error: 'Proposal not active' };

    if (inFavor) prop.voteFor++;
    else prop.voteAgainst++;

    // Check quorum (minimum 3 votes, >61.8% threshold)
    const total = prop.voteFor + prop.voteAgainst;
    if (total >= 3) {
      const ratio = prop.voteFor / total;
      if (ratio >= PHI_INV) {
        prop.status = 'passed';
      } else if ((1 - ratio) >= PHI_INV) {
        prop.status = 'rejected';
      }
    }

    return { ok: true, proposalId, status: prop.status, votes: { for: prop.voteFor, against: prop.voteAgainst } };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  PHEROMONE TRAIL — Communication Protocol
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get the current pheromone trail (active signals).
   * Signals with strength < 0.01 are considered evaporated.
   */
  getPheromoneTrail(limit = 50) {
    this._decayPheromones();
    return this._pheromoneTrail
      .filter(p => p.strength >= 0.01)
      .slice(-limit);
  }

  /**
   * Get pheromone signals for a specific engine.
   */
  getSignalsFor(engineCaste) {
    this._decayPheromones();
    return this._pheromoneTrail.filter(p =>
      p.strength >= 0.01 && (p.target === engineCaste || p.target === null)
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  COLONY HEALTH DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Get colony health snapshot.
   * Shows: engine states, pheromone activity, task throughput, economics.
   */
  getColonyHealth() {
    this._decayPheromones();

    const completed  = this._taskLog.filter(t => t.status === TASK_STATUS.COMPLETED).length;
    const rejected   = this._taskLog.filter(t => t.status === TASK_STATUS.REJECTED).length;
    const pending    = this._taskLog.length - completed - rejected;
    const totalCycles = this._taskLog.reduce((s, t) => s + (t.cyclesUsed || 0), 0);

    return {
      colonyId:       this.colonyId,
      uptime:         Date.now() - this.birthTime,
      population:     pending,
      temperature:    34.98,  // Optimal brood temperature
      resourceBalance: PHI_INV,
      queenSignal:    1.0,
      swarmPressure:  pending / 200,  // Ratio to MAX_WORKER_QUEUE
      engines: {
        [ENGINE_CASTE.WORKER]:     { tasks: completed, active: true },
        [ENGINE_CASTE.SCOUT]:      { tasks: this._taskLog.length, active: true },
        [ENGINE_CASTE.GUARD]:      { tasks: this._taskLog.length, active: true },
        [ENGINE_CASTE.BUILDER]:    { tasks: 0, active: true },
        [ENGINE_CASTE.MEMORY]:     { tasks: completed, active: true },
        [ENGINE_CASTE.GOVERNANCE]: { tasks: this._colonyState.proposals.length, active: true },
      },
      economics: {
        totalTasks:     this._taskLog.length,
        completed,
        rejected,
        pending,
        totalCycles,
        phiPremium:    PHI_SQ,
        signals:       this._pheromoneTrail.length,
        activeSignals: this._pheromoneTrail.filter(p => p.strength >= 0.01).length,
      },
      proposals: this._colonyState.proposals,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  MINIVERSE INTEGRATION — Inner MICRO + Outer Colony
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Process a task through Miniverse nesting:
   *   Inner MICRO layers → fast spectral pattern matching (MESIE)
   *   Outer engines → colony-level intelligence coordination
   *
   * Like individual bee neurons (inner) forming colony-level behavior (outer).
   */
  async processWithMiniverse(task, microPatternFn = null) {
    // Inner layer: fast MICRO pattern matching (if provided)
    let microResult = null;
    if (microPatternFn && typeof microPatternFn === 'function') {
      microResult = await microPatternFn(task.payload);
    }

    // Outer layer: treat MICRO result as coherent memory object
    const enrichedTask = {
      ...task,
      payload: microResult
        ? JSON.stringify({ original: task.payload, microPattern: microResult })
        : task.payload,
      priority: microResult?.confidence
        ? task.priority * microResult.confidence * PHI
        : task.priority,
    };

    // Route through colony pipeline
    return this.submitWork(enrichedTask);
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  INTERNAL ENGINE LOGIC
  // ═══════════════════════════════════════════════════════════════════════

  _scoutClassify(taskId, type, payload, priority) {
    // Scout classifies: determine surface, assign priority, detect opportunity value
    const surfaceMap = {
      'inference':  SURFACE.FORGE,
      'transform':  SURFACE.FORGE,
      'classify':   SURFACE.SOURCE,
      'deploy':     SURFACE.DEPLOY,
      'register':   SURFACE.NEXUS,
      'expand':     SURFACE.DEPLOY,
      'govern':     SURFACE.NEXUS,
    };

    const targetSurface = surfaceMap[type] || SURFACE.FORGE;
    const quality = Math.min(1.0, priority / PHI_CB);

    return {
      taskId,
      type,
      targetSurface,
      quality,
      classification: {
        isHighValue: quality > PHI_INV,
        urgency:     priority > PHI_SQ ? 'critical' : priority > PHI ? 'high' : 'normal',
        route:       `${SURFACE.SOURCE} → ${targetSurface}`,
      },
    };
  }

  _guardValidate(taskId, payload, priority) {
    // Guard validates: payload integrity, priority bounds, size limits
    const checks = {
      hasPayload:     payload && payload.length > 0,
      sizeOk:         payload.length < 1_000_000,
      priorityBounds: priority >= 0 && priority <= PHI_CB + 1,
      notEmpty:       payload.trim().length > 0,
    };

    const passed = Object.values(checks).every(Boolean);
    const reason = passed ? null : Object.entries(checks)
      .filter(([, v]) => !v).map(([k]) => k).join(', ');

    return { passed, checks, reason, taskId };
  }

  _emitLocalPheromone(source, target, type, data) {
    const signal = {
      id:        this._pheromoneTrail.length,
      timestamp: Date.now(),
      source,
      target,
      type,
      data,
      strength:  1.0,
      priority:  data.priority || PHI_INV,
    };
    this._pheromoneTrail.push(signal);

    // Bounded: keep last 500
    if (this._pheromoneTrail.length > 500) {
      this._pheromoneTrail = this._pheromoneTrail.slice(-250);
    }
  }

  _decayPheromones() {
    const now = Date.now();
    for (const signal of this._pheromoneTrail) {
      const age = (now - signal.timestamp) / 1000;  // seconds
      // Decay by 1/φ every 2 seconds (matches heartbeat interval)
      const decaySteps = Math.floor(age / 2);
      signal.strength = Math.pow(PHI_INV, decaySteps);
    }
  }

  _defaultColonyState() {
    return {
      proposals: [],
      temperature: 34.98,
      swarmPressure: 0,
    };
  }

  _hash(data) {
    let h = 5381;
    for (let i = 0; i < data.length; i++) {
      h = ((h * 33) + data.charCodeAt(i)) >>> 0;
    }
    return h.toString(16);
  }

  async _callCanister(method, args) {
    if (!this.icpAgent) throw new Error('No ICP agent configured');
    throw new Error(`Canister call not implemented: ${method}`);
  }
}

export default { CloudColonyClient, PHEROMONE_TYPE, ENGINE_CASTE, TASK_STATUS };
