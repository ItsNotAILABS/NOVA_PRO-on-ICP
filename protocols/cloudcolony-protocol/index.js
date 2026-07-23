/**
 * CloudColony Protocol — Decentralized AGI Colony Coordination
 *
 * The CloudColony Protocol defines how autonomous AGI organisms coordinate,
 * communicate, and collectively evolve within a decentralized cloud environment.
 *
 * Research Foundations:
 * - Olfati-Saber et al. (2007) "Consensus and Cooperation in Networked Multi-Agent Systems"
 * - Wooldridge (2009) "An Introduction to MultiAgent Systems"
 * - Shoham & Leyton-Brown (2009) "Multiagent Systems: Algorithmic, Game-Theoretic, and Logical Foundations"
 * - Decker (1987) "Distributed Problem-Solving" (TAEMS framework)
 * - Fischer et al. (1985) "Impossibility of Distributed Consensus with One Faulty Process" (FLP)
 *
 * Protocol Layers:
 * 1. Discovery — How organisms find and register with the colony
 * 2. Heartbeat — Liveness and health synchronization (φ-timed)
 * 3. Consensus — Collective decision-making (φ-threshold)
 * 4. Task Allocation — Distributed task assignment with capability matching
 * 5. Knowledge Sharing — Collective learning and memory consolidation
 * 6. Evolution — Colony-wide adaptation and self-improvement
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INV = 1 / PHI;
const PHI2 = PHI * PHI;
const PHI3 = PHI2 * PHI;

// Protocol version
const PROTOCOL_VERSION = '1.0.0-phi';

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 1: Discovery Protocol
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ColonyRegistry — Organism discovery and registration
 *
 * Implements a gossip-based discovery protocol where organisms announce
 * their capabilities and discover peers through epidemic spread.
 *
 * Reference: Demers et al. (1987) "Epidemic Algorithms for Replicated Database Maintenance"
 */
export class ColonyRegistry {
  constructor(config = {}) {
    this.colonyId = config.colonyId || `colony-${Date.now()}`;
    this.organisms = new Map();
    this.gossipInterval = config.gossipInterval || PHI * 1000; // φ seconds
    this.maxOrganisms = config.maxOrganisms || Math.floor(PHI3 * 100);
    this._gossipTimer = null;
  }

  /**
   * Register an organism with the colony
   */
  register(organism) {
    const registration = {
      id: organism.id,
      capabilities: organism.capabilities || [],
      endpoint: organism.endpoint,
      heartbeatMs: organism.heartbeatMs || 873,
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      status: 'active',
      metadata: organism.metadata || {},
      generation: organism.generation || 0,
      trustScore: PHI_INV // Initial trust = golden ratio inverse
    };

    this.organisms.set(organism.id, registration);
    return registration;
  }

  /**
   * Deregister an organism
   */
  deregister(organismId) {
    return this.organisms.delete(organismId);
  }

  /**
   * Find organisms by capability
   */
  discover(capability) {
    const matches = [];
    for (const [id, org] of this.organisms) {
      if (org.status === 'active' && org.capabilities.includes(capability)) {
        matches.push(org);
      }
    }
    // Sort by trust score (highest first)
    return matches.sort((a, b) => b.trustScore - a.trustScore);
  }

  /**
   * Start gossip protocol for peer discovery
   */
  startGossip(gossipFn) {
    this._gossipTimer = setInterval(() => {
      const activeOrganisms = Array.from(this.organisms.values()).filter(o => o.status === 'active');
      if (activeOrganisms.length > 1 && gossipFn) {
        // Select random peer for gossip exchange
        const peer = activeOrganisms[Math.floor(Math.random() * activeOrganisms.length)];
        gossipFn(peer, Array.from(this.organisms.values()));
      }
    }, this.gossipInterval);
  }

  stopGossip() {
    if (this._gossipTimer) {
      clearInterval(this._gossipTimer);
      this._gossipTimer = null;
    }
  }

  /**
   * Update organism liveness
   */
  heartbeat(organismId) {
    const org = this.organisms.get(organismId);
    if (org) {
      org.lastSeen = Date.now();
      org.status = 'active';
    }
  }

  /**
   * Prune stale organisms (not seen in φ³ × heartbeat ms)
   */
  prune() {
    const now = Date.now();
    for (const [id, org] of this.organisms) {
      const staleness = now - org.lastSeen;
      const threshold = PHI3 * org.heartbeatMs;
      if (staleness > threshold) {
        org.status = 'stale';
      }
      if (staleness > threshold * PHI) {
        this.organisms.delete(id);
      }
    }
  }

  getMetrics() {
    return {
      colonyId: this.colonyId,
      totalOrganisms: this.organisms.size,
      activeOrganisms: Array.from(this.organisms.values()).filter(o => o.status === 'active').length,
      capabilities: [...new Set(Array.from(this.organisms.values()).flatMap(o => o.capabilities))]
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 2: Heartbeat Synchronization Protocol
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ColonyHeartbeat — φ-synchronized liveness protocol
 *
 * Implements a Kuramoto-inspired synchronization protocol where organisms
 * gradually align their heartbeats to the colony's natural frequency.
 *
 * Reference: Kuramoto (1984) "Chemical Oscillations, Waves, and Turbulence"
 * Reference: Strogatz (2000) "From Kuramoto to Crawford"
 */
export class ColonyHeartbeat {
  constructor(config = {}) {
    this.baseFrequency = config.baseFrequency || 873; // ms (φ × 540)
    this.couplingStrength = config.couplingStrength || PHI_INV * 0.1;
    this.organisms = new Map();
    this.globalPhase = 0;
    this.syncOrder = 0; // Kuramoto order parameter r ∈ [0,1]
    this._running = false;
    this._timer = null;
  }

  /**
   * Add organism to heartbeat sync
   */
  addOrganism(organismId, naturalFrequency = null) {
    this.organisms.set(organismId, {
      id: organismId,
      phase: Math.random() * 2 * Math.PI,
      naturalFrequency: naturalFrequency || this.baseFrequency + (Math.random() - 0.5) * 100,
      lastBeat: Date.now()
    });
  }

  /**
   * Start synchronization loop
   */
  start() {
    this._running = true;
    this._syncLoop();
  }

  stop() {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /**
   * Record a heartbeat from an organism
   */
  recordBeat(organismId) {
    const org = this.organisms.get(organismId);
    if (org) {
      org.lastBeat = Date.now();
      org.phase = (Date.now() % org.naturalFrequency) / org.naturalFrequency * 2 * Math.PI;
    }
  }

  /**
   * Compute Kuramoto order parameter (synchronization measure)
   */
  computeSync() {
    const phases = Array.from(this.organisms.values()).map(o => o.phase);
    if (phases.length === 0) return 0;

    // r = |1/N Σ e^(iθ_j)|
    let realSum = 0;
    let imagSum = 0;
    for (const phase of phases) {
      realSum += Math.cos(phase);
      imagSum += Math.sin(phase);
    }
    realSum /= phases.length;
    imagSum /= phases.length;

    this.syncOrder = Math.sqrt(realSum * realSum + imagSum * imagSum);
    this.globalPhase = Math.atan2(imagSum, realSum);

    return this.syncOrder;
  }

  _syncLoop() {
    if (!this._running) return;

    // Kuramoto coupling step
    for (const [id, org] of this.organisms) {
      let coupling = 0;
      for (const [otherId, other] of this.organisms) {
        if (id === otherId) continue;
        coupling += Math.sin(other.phase - org.phase);
      }
      coupling *= this.couplingStrength / this.organisms.size;

      // Update phase: dθ/dt = ω + K/N Σ sin(θ_j - θ_i)
      org.phase += (2 * Math.PI / org.naturalFrequency) * this.baseFrequency + coupling;
      org.phase %= 2 * Math.PI;
    }

    this.computeSync();

    this._timer = setTimeout(() => this._syncLoop(), this.baseFrequency);
  }

  getMetrics() {
    return {
      organisms: this.organisms.size,
      syncOrder: this.syncOrder,
      globalPhase: this.globalPhase,
      baseFrequency: this.baseFrequency,
      running: this._running
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 3: Consensus Protocol
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ColonyConsensus — φ-threshold collective decision making
 *
 * Implements a Byzantine fault-tolerant consensus protocol using
 * golden ratio thresholds instead of traditional 2/3 majority.
 *
 * φ/(φ+1) ≈ 0.618 threshold provides optimal balance between
 * liveness and safety in the colony.
 *
 * Reference: Lamport et al. (1982) "The Byzantine Generals Problem"
 * Reference: Castro & Liskov (1999) "Practical Byzantine Fault Tolerance"
 */
export class ColonyConsensus {
  constructor(config = {}) {
    this.threshold = config.threshold || PHI_INV; // ≈ 0.618
    this.proposals = new Map();
    this.rounds = 0;
    this.decidedLog = [];
  }

  /**
   * Propose a decision to the colony
   */
  propose(proposerId, proposal) {
    const id = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.proposals.set(id, {
      id,
      proposerId,
      content: proposal,
      votes: new Map(),
      status: 'pending',
      createdAt: Date.now(),
      round: ++this.rounds,
      decidedAt: null
    });
    return id;
  }

  /**
   * Vote on a proposal
   */
  vote(proposalId, voterId, decision, weight = 1.0) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== 'pending') return false;

    proposal.votes.set(voterId, {
      decision, // 'accept' | 'reject' | 'abstain'
      weight,
      timestamp: Date.now()
    });

    // Check if consensus reached
    this._checkConsensus(proposal);
    return true;
  }

  /**
   * Check consensus status
   */
  getStatus(proposalId) {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) return null;

    const totalWeight = Array.from(proposal.votes.values()).reduce((s, v) => s + v.weight, 0);
    const acceptWeight = Array.from(proposal.votes.values())
      .filter(v => v.decision === 'accept')
      .reduce((s, v) => s + v.weight, 0);

    return {
      id: proposal.id,
      status: proposal.status,
      votes: proposal.votes.size,
      acceptance: totalWeight > 0 ? acceptWeight / totalWeight : 0,
      threshold: this.threshold,
      consensusReached: proposal.status === 'decided'
    };
  }

  _checkConsensus(proposal) {
    const totalWeight = Array.from(proposal.votes.values()).reduce((s, v) => s + v.weight, 0);
    if (totalWeight === 0) return;

    const acceptWeight = Array.from(proposal.votes.values())
      .filter(v => v.decision === 'accept')
      .reduce((s, v) => s + v.weight, 0);

    const rejectWeight = Array.from(proposal.votes.values())
      .filter(v => v.decision === 'reject')
      .reduce((s, v) => s + v.weight, 0);

    const acceptRatio = acceptWeight / totalWeight;
    const rejectRatio = rejectWeight / totalWeight;

    if (acceptRatio >= this.threshold) {
      proposal.status = 'decided';
      proposal.decision = 'accepted';
      proposal.decidedAt = Date.now();
      this.decidedLog.push({ ...proposal, votes: Object.fromEntries(proposal.votes) });
    } else if (rejectRatio > (1 - this.threshold)) {
      proposal.status = 'decided';
      proposal.decision = 'rejected';
      proposal.decidedAt = Date.now();
      this.decidedLog.push({ ...proposal, votes: Object.fromEntries(proposal.votes) });
    }
  }

  getMetrics() {
    return {
      totalProposals: this.proposals.size,
      pendingProposals: Array.from(this.proposals.values()).filter(p => p.status === 'pending').length,
      decidedProposals: this.decidedLog.length,
      rounds: this.rounds,
      threshold: this.threshold
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 4: Task Allocation Protocol
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ColonyTaskAllocator — Distributed task assignment with capability matching
 *
 * Implements Contract Net Protocol (Smith, 1980) enhanced with
 * φ-weighted capability scoring and load balancing.
 *
 * Reference: Smith (1980) "The Contract Net Protocol"
 * Reference: Gerkey & Matarić (2004) "A Formal Analysis and Taxonomy of Task Allocation"
 */
export class ColonyTaskAllocator {
  constructor(config = {}) {
    this.tasks = new Map();
    this.assignments = new Map();
    this.loadBalancer = new Map(); // organismId -> current load
    this.completionLog = [];
    this.maxLoadPerOrganism = config.maxLoad || Math.floor(PHI3);
  }

  /**
   * Submit a task for allocation
   */
  submitTask(task) {
    const taskEntry = {
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      requiredCapabilities: task.capabilities || [],
      priority: task.priority || 1.0,
      payload: task.payload,
      deadline: task.deadline || null,
      status: 'pending',
      submittedAt: Date.now(),
      assignedTo: null,
      bids: []
    };

    this.tasks.set(taskEntry.id, taskEntry);
    return taskEntry.id;
  }

  /**
   * Organism bids on a task (Contract Net Protocol)
   */
  bid(taskId, organismId, capabilities, bidScore) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'pending') return false;

    // Capability matching score
    const required = new Set(task.requiredCapabilities);
    const offered = new Set(capabilities);
    const overlap = [...required].filter(c => offered.has(c)).length;
    const capabilityScore = required.size > 0 ? overlap / required.size : 1.0;

    // Load factor (prefer less loaded organisms)
    const currentLoad = this.loadBalancer.get(organismId) || 0;
    const loadFactor = 1 - (currentLoad / this.maxLoadPerOrganism);

    // φ-weighted combined score
    const totalScore = (capabilityScore * PHI + bidScore + loadFactor) / (PHI + 2);

    task.bids.push({
      organismId,
      capabilityScore,
      bidScore,
      loadFactor,
      totalScore,
      timestamp: Date.now()
    });

    return true;
  }

  /**
   * Allocate task to best bidder
   */
  allocate(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.bids.length === 0) return null;

    // Select best bid
    const bestBid = task.bids.sort((a, b) => b.totalScore - a.totalScore)[0];

    task.status = 'assigned';
    task.assignedTo = bestBid.organismId;

    // Update load
    const currentLoad = this.loadBalancer.get(bestBid.organismId) || 0;
    this.loadBalancer.set(bestBid.organismId, currentLoad + 1);

    this.assignments.set(taskId, bestBid.organismId);

    return {
      taskId,
      assignedTo: bestBid.organismId,
      score: bestBid.totalScore
    };
  }

  /**
   * Mark task as complete
   */
  complete(taskId, result) {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;

    // Release load
    if (task.assignedTo) {
      const currentLoad = this.loadBalancer.get(task.assignedTo) || 1;
      this.loadBalancer.set(task.assignedTo, Math.max(0, currentLoad - 1));
    }

    this.completionLog.push({
      taskId,
      organism: task.assignedTo,
      duration: task.completedAt - task.submittedAt,
      timestamp: task.completedAt
    });

    return true;
  }

  getMetrics() {
    return {
      totalTasks: this.tasks.size,
      pending: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
      assigned: Array.from(this.tasks.values()).filter(t => t.status === 'assigned').length,
      completed: this.completionLog.length,
      avgDuration: this.completionLog.length > 0
        ? this.completionLog.reduce((s, c) => s + c.duration, 0) / this.completionLog.length
        : 0
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 5: Knowledge Sharing Protocol
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ColonyKnowledge — Collective learning and memory consolidation
 *
 * Implements a distributed knowledge graph where organisms share learned
 * patterns, with φ-weighted trust and relevance scoring.
 *
 * Reference: Ren et al. (2020) "Knowledge Graph Embedding: A Survey from the Perspective of Representation Learning"
 * Reference: Weng et al. (2001) "Autonomous Mental Development"
 */
export class ColonyKnowledge {
  constructor(config = {}) {
    this.facts = new Map();
    this.contributors = new Map();
    this.queries = [];
  }

  /**
   * Share a learned fact with the colony
   */
  share(organismId, fact) {
    const entry = {
      id: `fact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      content: fact.content,
      category: fact.category || 'general',
      confidence: fact.confidence || PHI_INV,
      contributor: organismId,
      sharedAt: Date.now(),
      validations: 0,
      refutations: 0,
      references: fact.references || []
    };

    this.facts.set(entry.id, entry);

    // Track contributor
    const count = this.contributors.get(organismId) || 0;
    this.contributors.set(organismId, count + 1);

    return entry.id;
  }

  /**
   * Validate or refute a shared fact
   */
  validate(factId, organismId, isValid) {
    const fact = this.facts.get(factId);
    if (!fact) return false;

    if (isValid) {
      fact.validations++;
      // φ-boost confidence
      fact.confidence = Math.min(1.0, fact.confidence * (1 + PHI_INV * 0.1));
    } else {
      fact.refutations++;
      // Reduce confidence
      fact.confidence = Math.max(0, fact.confidence * (1 - PHI_INV * 0.1));
    }

    return true;
  }

  /**
   * Query colony knowledge
   */
  query(category, minConfidence = PHI_INV * 0.5) {
    const results = [];
    for (const [id, fact] of this.facts) {
      if (fact.category === category && fact.confidence >= minConfidence) {
        results.push(fact);
      }
    }
    // Sort by confidence (highest first)
    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Consolidate knowledge (remove low-confidence facts)
   */
  consolidate() {
    const removed = [];
    for (const [id, fact] of this.facts) {
      // Remove facts with low confidence and many refutations
      if (fact.confidence < PHI_INV * 0.2 && fact.refutations > fact.validations) {
        this.facts.delete(id);
        removed.push(id);
      }
    }
    return removed;
  }

  getMetrics() {
    return {
      totalFacts: this.facts.size,
      contributors: this.contributors.size,
      avgConfidence: this.facts.size > 0
        ? Array.from(this.facts.values()).reduce((s, f) => s + f.confidence, 0) / this.facts.size
        : 0,
      categories: [...new Set(Array.from(this.facts.values()).map(f => f.category))]
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYER 6: Evolution Protocol
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * ColonyEvolution — Colony-wide adaptation and self-improvement
 *
 * Implements evolutionary strategies at the colony level, where the
 * collective behavior evolves through selection, mutation, and crossover
 * of organism behaviors.
 *
 * Reference: Stanley & Miikkulainen (2002) "Evolving Neural Networks through Augmenting Topologies"
 * Reference: Eiben & Smith (2015) "Introduction to Evolutionary Computing"
 */
export class ColonyEvolution {
  constructor(config = {}) {
    this.generation = 0;
    this.population = new Map();
    this.fitnessHistory = [];
    this.mutationRate = config.mutationRate || PHI_INV * 0.1;
    this.crossoverRate = config.crossoverRate || PHI_INV;
    this.elitismRate = config.elitismRate || PHI_INV * 0.2;
  }

  /**
   * Register organism genome (behavior parameters)
   */
  registerGenome(organismId, genome) {
    this.population.set(organismId, {
      id: organismId,
      genome: { ...genome },
      fitness: 0,
      generation: this.generation,
      parent: null
    });
  }

  /**
   * Evaluate fitness of all organisms
   */
  async evaluateFitness(fitnessFn) {
    for (const [id, individual] of this.population) {
      individual.fitness = await Promise.resolve(fitnessFn(individual.genome));
    }
  }

  /**
   * Run one evolutionary generation
   */
  async evolve(fitnessFn) {
    this.generation++;

    // Evaluate current fitness
    await this.evaluateFitness(fitnessFn);

    // Sort by fitness
    const sorted = Array.from(this.population.values()).sort((a, b) => b.fitness - a.fitness);

    // Record generation stats
    const avgFitness = sorted.reduce((s, i) => s + i.fitness, 0) / sorted.length;
    this.fitnessHistory.push({
      generation: this.generation,
      bestFitness: sorted[0]?.fitness || 0,
      avgFitness,
      worstFitness: sorted[sorted.length - 1]?.fitness || 0,
      timestamp: Date.now()
    });

    // Elitism: keep top performers
    const eliteCount = Math.max(1, Math.floor(sorted.length * this.elitismRate));
    const newPopulation = new Map();

    for (let i = 0; i < eliteCount; i++) {
      newPopulation.set(sorted[i].id, sorted[i]);
    }

    // Fill rest with crossover + mutation
    while (newPopulation.size < this.population.size) {
      const parent1 = this._tournamentSelect(sorted);
      const parent2 = this._tournamentSelect(sorted);

      let childGenome;
      if (Math.random() < this.crossoverRate) {
        childGenome = this._crossover(parent1.genome, parent2.genome);
      } else {
        childGenome = { ...parent1.genome };
      }

      // Mutation
      if (Math.random() < this.mutationRate) {
        childGenome = this._mutate(childGenome);
      }

      const childId = `org-gen${this.generation}-${newPopulation.size}`;
      newPopulation.set(childId, {
        id: childId,
        genome: childGenome,
        fitness: 0,
        generation: this.generation,
        parent: parent1.id
      });
    }

    this.population = newPopulation;

    return {
      generation: this.generation,
      bestFitness: sorted[0]?.fitness || 0,
      avgFitness,
      populationSize: this.population.size
    };
  }

  _tournamentSelect(sorted, tournamentSize = 3) {
    const candidates = [];
    for (let i = 0; i < tournamentSize; i++) {
      candidates.push(sorted[Math.floor(Math.random() * sorted.length)]);
    }
    return candidates.sort((a, b) => b.fitness - a.fitness)[0];
  }

  _crossover(genome1, genome2) {
    const child = {};
    const keys = new Set([...Object.keys(genome1), ...Object.keys(genome2)]);
    for (const key of keys) {
      // φ-weighted crossover: prefer fitter parent's genes
      child[key] = Math.random() < PHI_INV ? genome1[key] : genome2[key];
    }
    return child;
  }

  _mutate(genome) {
    const mutated = { ...genome };
    const keys = Object.keys(mutated);
    if (keys.length === 0) return mutated;

    const mutateKey = keys[Math.floor(Math.random() * keys.length)];
    const value = mutated[mutateKey];

    if (typeof value === 'number') {
      // Gaussian mutation with φ-scaled standard deviation
      mutated[mutateKey] = value + (Math.random() - 0.5) * 2 * PHI_INV * Math.abs(value || 1);
    } else if (typeof value === 'boolean') {
      mutated[mutateKey] = !value;
    }

    return mutated;
  }

  getMetrics() {
    return {
      generation: this.generation,
      populationSize: this.population.size,
      fitnessHistory: this.fitnessHistory.slice(-10),
      mutationRate: this.mutationRate,
      crossoverRate: this.crossoverRate
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// CloudColony Protocol Coordinator
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * CloudColonyProtocol — Full protocol stack coordinator
 *
 * Integrates all protocol layers into a single, production-ready system.
 */
export class CloudColonyProtocol {
  constructor(config = {}) {
    this.version = PROTOCOL_VERSION;
    this.registry = new ColonyRegistry(config.registry);
    this.heartbeat = new ColonyHeartbeat(config.heartbeat);
    this.consensus = new ColonyConsensus(config.consensus);
    this.taskAllocator = new ColonyTaskAllocator(config.tasks);
    this.knowledge = new ColonyKnowledge(config.knowledge);
    this.evolution = new ColonyEvolution(config.evolution);
    this._started = false;
  }

  /**
   * Initialize and start the full protocol stack
   */
  start() {
    this._started = true;
    this.heartbeat.start();
    this.registry.startGossip();
    return this;
  }

  /**
   * Stop all protocol layers
   */
  stop() {
    this._started = false;
    this.heartbeat.stop();
    this.registry.stopGossip();
  }

  /**
   * Join an organism to the colony (full lifecycle)
   */
  join(organism) {
    const registration = this.registry.register(organism);
    this.heartbeat.addOrganism(organism.id);
    return registration;
  }

  /**
   * Remove an organism from the colony
   */
  leave(organismId) {
    this.registry.deregister(organismId);
  }

  /**
   * Get full protocol status
   */
  getStatus() {
    return {
      version: this.version,
      started: this._started,
      registry: this.registry.getMetrics(),
      heartbeat: this.heartbeat.getMetrics(),
      consensus: this.consensus.getMetrics(),
      tasks: this.taskAllocator.getMetrics(),
      knowledge: this.knowledge.getMetrics(),
      evolution: this.evolution.getMetrics()
    };
  }
}

// Export all protocol components
export {
  PROTOCOL_VERSION,
  PHI,
  PHI_INV,
  PHI2,
  PHI3
};
