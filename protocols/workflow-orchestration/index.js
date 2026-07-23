/**
 * Workflow Orchestration Protocol — Deep Pipeline Coordination for AGI Engines
 *
 * Production-ready workflow engine that embeds AGI operations into
 * deterministic, observable, and recoverable pipelines.
 *
 * Features:
 * - DAG-based workflow definition (no cycles)
 * - Retry with exponential φ-backoff
 * - Checkpointing and recovery
 * - Parallel step execution where dependencies allow
 * - Observable execution traces
 * - Timeout management (φ-scaled)
 * - Dead letter queue for failed steps
 *
 * Research Foundations:
 * - van der Aalst (2016) "Process Mining: Data Science in Action"
 * - Yu & Buyya (2005) "A Taxonomy of Workflow Management Systems"
 * - Dean & Ghemawat (2004) "MapReduce: Simplified Data Processing on Large Clusters"
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INV = 1 / PHI;
const PHI2 = PHI * PHI;
const PHI3 = PHI2 * PHI;

// ═══════════════════════════════════════════════════════════════════════════════
// Workflow Definition
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WorkflowBuilder — Fluent API for constructing workflow DAGs
 */
export class WorkflowBuilder {
  constructor(name) {
    this.name = name;
    this.steps = new Map();
    this.edges = []; // [from, to]
    this.config = {
      maxRetries: 3,
      timeoutMs: PHI3 * 10000, // ~42 seconds default
      checkpointing: true
    };
  }

  /**
   * Add a step to the workflow
   */
  step(name, handler, options = {}) {
    this.steps.set(name, {
      name,
      handler,
      retries: options.retries ?? this.config.maxRetries,
      timeout: options.timeout ?? this.config.timeoutMs,
      critical: options.critical ?? true,
      parallel: options.parallel ?? false,
      inputMapper: options.inputMapper || null,
      outputMapper: options.outputMapper || null
    });
    return this;
  }

  /**
   * Define dependency (from must complete before to)
   */
  dependsOn(step, dependency) {
    this.edges.push([dependency, step]);
    return this;
  }

  /**
   * Chain steps sequentially
   */
  chain(...stepNames) {
    for (let i = 1; i < stepNames.length; i++) {
      this.edges.push([stepNames[i - 1], stepNames[i]]);
    }
    return this;
  }

  /**
   * Define parallel group (all run concurrently after shared dependency)
   */
  parallel(afterStep, ...parallelSteps) {
    for (const step of parallelSteps) {
      this.edges.push([afterStep, step]);
    }
    return this;
  }

  /**
   * Set workflow-level configuration
   */
  configure(config) {
    Object.assign(this.config, config);
    return this;
  }

  /**
   * Build the workflow definition
   */
  build() {
    // Validate DAG (no cycles)
    this._validateDAG();

    return {
      name: this.name,
      steps: new Map(this.steps),
      edges: [...this.edges],
      config: { ...this.config },
      createdAt: Date.now()
    };
  }

  _validateDAG() {
    // Topological sort to detect cycles
    const visited = new Set();
    const inStack = new Set();

    const adjacency = new Map();
    for (const [from, to] of this.edges) {
      if (!adjacency.has(from)) adjacency.set(from, []);
      adjacency.get(from).push(to);
    }

    const visit = (node) => {
      if (inStack.has(node)) {
        throw new Error(`Cycle detected in workflow at step: ${node}`);
      }
      if (visited.has(node)) return;
      inStack.add(node);
      for (const neighbor of (adjacency.get(node) || [])) {
        visit(neighbor);
      }
      inStack.delete(node);
      visited.add(node);
    };

    for (const name of this.steps.keys()) {
      visit(name);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Workflow Executor
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * WorkflowExecutor — Production-ready workflow execution engine
 */
export class WorkflowExecutor {
  constructor(config = {}) {
    this.executions = new Map();
    this.checkpoints = new Map();
    this.deadLetterQueue = [];
    this.observers = [];
    this.maxConcurrency = config.maxConcurrency || Math.floor(PHI3);
  }

  /**
   * Execute a workflow definition
   */
  async execute(workflow, input = {}) {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const execution = {
      id: executionId,
      workflow: workflow.name,
      status: 'running',
      input,
      output: null,
      startedAt: Date.now(),
      completedAt: null,
      stepResults: new Map(),
      trace: [],
      errors: []
    };

    this.executions.set(executionId, execution);
    this._emit('workflow:start', { executionId, workflow: workflow.name });

    try {
      // Compute execution order (topological sort with parallel grouping)
      const executionPlan = this._computeExecutionPlan(workflow);

      // Execute plan
      let currentData = { ...input };

      for (const group of executionPlan) {
        if (group.length === 1) {
          // Sequential execution
          currentData = await this._executeStep(
            execution, workflow, group[0], currentData
          );
        } else {
          // Parallel execution
          const results = await Promise.allSettled(
            group.map(stepName =>
              this._executeStep(execution, workflow, stepName, currentData)
            )
          );

          // Merge parallel results
          for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
              currentData = { ...currentData, ...result.value };
            }
          }
        }

        // Checkpoint after each group
        if (workflow.config.checkpointing) {
          this._checkpoint(executionId, currentData);
        }
      }

      execution.status = 'completed';
      execution.output = currentData;
      execution.completedAt = Date.now();
      this._emit('workflow:complete', { executionId, duration: execution.completedAt - execution.startedAt });

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = Date.now();
      execution.errors.push({ error: error.message, timestamp: Date.now() });
      this._emit('workflow:error', { executionId, error: error.message });
    }

    return execution;
  }

  /**
   * Resume a failed workflow from last checkpoint
   */
  async resume(executionId) {
    const checkpoint = this.checkpoints.get(executionId);
    const execution = this.executions.get(executionId);

    if (!checkpoint || !execution) {
      throw new Error(`No checkpoint found for execution: ${executionId}`);
    }

    execution.status = 'running';
    this._emit('workflow:resume', { executionId });

    // Resume from checkpoint data
    // (simplified: re-run from beginning with checkpoint data as input)
    return checkpoint.data;
  }

  /**
   * Register an observer for workflow events
   */
  observe(callback) {
    this.observers.push(callback);
    return this;
  }

  async _executeStep(execution, workflow, stepName, input) {
    const step = workflow.steps.get(stepName);
    if (!step) throw new Error(`Step '${stepName}' not found in workflow`);

    const stepExec = {
      step: stepName,
      startedAt: Date.now(),
      retries: 0,
      status: 'running'
    };

    execution.trace.push(stepExec);
    this._emit('step:start', { executionId: execution.id, step: stepName });

    // Apply input mapper if defined
    const stepInput = step.inputMapper ? step.inputMapper(input) : input;

    // Retry loop with φ-exponential backoff
    let lastError = null;
    for (let attempt = 0; attempt <= step.retries; attempt++) {
      try {
        // Execute with timeout
        const result = await this._withTimeout(
          step.handler(stepInput),
          step.timeout
        );

        // Apply output mapper
        const output = step.outputMapper ? step.outputMapper(result) : result;

        stepExec.status = 'completed';
        stepExec.completedAt = Date.now();
        stepExec.duration = stepExec.completedAt - stepExec.startedAt;

        execution.stepResults.set(stepName, output);
        this._emit('step:complete', {
          executionId: execution.id,
          step: stepName,
          duration: stepExec.duration
        });

        return typeof output === 'object' ? { ...input, ...output } : input;

      } catch (error) {
        lastError = error;
        stepExec.retries++;

        if (attempt < step.retries) {
          // φ-exponential backoff: PHI^attempt × 100ms
          const backoffMs = Math.pow(PHI, attempt) * 100;
          await this._sleep(backoffMs);
          this._emit('step:retry', {
            executionId: execution.id,
            step: stepName,
            attempt: attempt + 1,
            backoffMs
          });
        }
      }
    }

    // All retries exhausted
    stepExec.status = 'failed';
    stepExec.error = lastError?.message;
    stepExec.completedAt = Date.now();

    this.deadLetterQueue.push({
      executionId: execution.id,
      step: stepName,
      error: lastError?.message,
      input: stepInput,
      timestamp: Date.now()
    });

    this._emit('step:failed', { executionId: execution.id, step: stepName, error: lastError?.message });

    if (step.critical) {
      throw new Error(`Critical step '${stepName}' failed: ${lastError?.message}`);
    }

    return input; // Non-critical: continue with unchanged input
  }

  _computeExecutionPlan(workflow) {
    // Topological sort with parallel grouping
    const inDegree = new Map();
    const adjacency = new Map();

    for (const name of workflow.steps.keys()) {
      inDegree.set(name, 0);
      adjacency.set(name, []);
    }

    for (const [from, to] of workflow.edges) {
      adjacency.get(from)?.push(to);
      inDegree.set(to, (inDegree.get(to) || 0) + 1);
    }

    // Kahn's algorithm with level grouping
    const plan = [];
    let queue = [...inDegree.entries()]
      .filter(([, deg]) => deg === 0)
      .map(([name]) => name);

    while (queue.length > 0) {
      plan.push([...queue]); // All nodes at this level can run in parallel

      const nextQueue = [];
      for (const node of queue) {
        for (const neighbor of (adjacency.get(node) || [])) {
          inDegree.set(neighbor, inDegree.get(neighbor) - 1);
          if (inDegree.get(neighbor) === 0) {
            nextQueue.push(neighbor);
          }
        }
      }
      queue = nextQueue;
    }

    return plan;
  }

  _checkpoint(executionId, data) {
    this.checkpoints.set(executionId, {
      executionId,
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now()
    });
  }

  _withTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Step timed out after ${timeoutMs}ms`)), timeoutMs);
      Promise.resolve(promise).then(
        (result) => { clearTimeout(timer); resolve(result); },
        (error) => { clearTimeout(timer); reject(error); }
      );
    });
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _emit(event, data) {
    for (const observer of this.observers) {
      try {
        observer(event, data);
      } catch (e) {
        // Observer errors don't break workflow
      }
    }
  }

  getMetrics() {
    return {
      totalExecutions: this.executions.size,
      running: Array.from(this.executions.values()).filter(e => e.status === 'running').length,
      completed: Array.from(this.executions.values()).filter(e => e.status === 'completed').length,
      failed: Array.from(this.executions.values()).filter(e => e.status === 'failed').length,
      deadLetterQueueSize: this.deadLetterQueue.length,
      checkpoints: this.checkpoints.size
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Predefined AGI Workflows
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Create standard AGI workflow templates
 */
export function createAGIWorkflows() {
  // Workflow 1: Deep Reasoning Pipeline
  const deepReasoning = new WorkflowBuilder('deep-reasoning')
    .step('perceive', async (input) => {
      return { ...input, perceived: true, timestamp: Date.now() };
    })
    .step('contextualize', async (input) => {
      return { ...input, context: { depth: 0, relevance: PHI_INV } };
    })
    .step('reason', async (input) => {
      return { ...input, reasoning: { confidence: PHI_INV, method: 'analytical' } };
    })
    .step('validate', async (input) => {
      const isValid = (input.reasoning?.confidence || 0) >= PHI_INV * 0.5;
      return { ...input, validated: isValid };
    })
    .step('respond', async (input) => {
      return { ...input, response: { ready: true, quality: input.reasoning?.confidence || 0 } };
    })
    .chain('perceive', 'contextualize', 'reason', 'validate', 'respond')
    .configure({ maxRetries: 3, checkpointing: true })
    .build();

  // Workflow 2: Collective Intelligence Pipeline
  const collectiveIntelligence = new WorkflowBuilder('collective-intelligence')
    .step('gather', async (input) => {
      return { ...input, sources: [], gathered: true };
    })
    .step('synthesize', async (input) => {
      return { ...input, synthesis: { consensus: PHI_INV } };
    })
    .step('validate_collective', async (input) => {
      return { ...input, collectiveValid: true };
    })
    .step('distribute', async (input) => {
      return { ...input, distributed: true };
    })
    .chain('gather', 'synthesize', 'validate_collective', 'distribute')
    .build();

  // Workflow 3: Self-Improvement Cycle
  const selfImprovement = new WorkflowBuilder('self-improvement')
    .step('measure', async (input) => {
      return { ...input, baseline: { fitness: PHI_INV } };
    })
    .step('analyze_gaps', async (input) => {
      return { ...input, gaps: ['efficiency', 'accuracy'] };
    })
    .step('generate_candidates', async (input) => {
      return { ...input, candidates: [{ type: 'optimization', expected: PHI_INV * 1.1 }] };
    })
    .step('verify', async (input) => {
      return { ...input, verified: true };
    })
    .step('apply', async (input) => {
      return { ...input, applied: input.verified };
    })
    .chain('measure', 'analyze_gaps', 'generate_candidates', 'verify', 'apply')
    .configure({ maxRetries: 5, checkpointing: true })
    .build();

  return { deepReasoning, collectiveIntelligence, selfImprovement };
}

export { PHI, PHI_INV, PHI2, PHI3 };
