///
/// CALL MARKET — Three Parallel Market Surfaces
///
/// ═══════════════════════════════════════════════════════════════════════
///  NOT ONE MARKET.  THREE PARALLEL MARKET SURFACES.
/// ═══════════════════════════════════════════════════════════════════════
///
/// 1. INTERNAL CALL MARKET
///    For your own organisms, agents, SDK organisms, and branch systems.
///    AIs call internal tools.  Internal routing happens.  Experiments run.
///    Pricing can be virtual/weight-based first.
///
/// 2. DEVELOPER CALL MARKET
///    For outside builders.  Callable SDKs.  Registry browsing.
///    API keys / principals / permission paths.  Standard call contracts.
///    Docs + examples.
///
/// 3. AI-NATIVE CALL MARKET
///    AI agents can discover calls.  Choose a call.  Invoke a call.
///    Receive structured output.  Chain calls together.
///    Machine-readable metadata powers autonomous tool selection.
///
/// All three surfaces share the same Call Registry underneath.
/// The difference is access control, pricing, and discovery interface.
///

/// Casa de Medina — Architectos de Architectura Inteligente
///

import {
  PHI,
  fibonacciHash,
} from '../intelligence/ObserverIntelligence.js';

import {
  CallRegistry,
  REGISTERED_CALLS,
  type RegisteredCall,
  type CallCategory,
  type CallSearchQuery,
  type CallSearchResult,
  type CallChain,
} from './CallRegistry.js';

import {
  type CostClass,
  type LatencyClass,
  type SecurityTier,
  type AgentCallResult,
} from './AlphaAgentRegistry.js';

// ══════════════════════════════════════════════════════════════════
//  TYPES — Market Surfaces
// ══════════════════════════════════════════════════════════════════

/** The three market surface types. */
export type MarketSurface = 'internal' | 'developer' | 'ai-native';

/** Permission level for market access. */
export type MarketPermission =
  | 'read'           // browse registry
  | 'invoke'         // invoke calls
  | 'chain'          // chain calls together
  | 'admin';         // manage registry entries

/** A market principal — entity identity with permissions. */
export interface MarketPrincipal {
  readonly principalId: string;
  readonly name: string;
  readonly surface: MarketSurface;
  readonly permissions: readonly MarketPermission[];
  readonly tier: CostClass;                // subscription tier
  readonly rateLimitPerMinute: number;
  readonly dailyBudget: number;            // in credits
  readonly apiKey?: string;                // for developer surface
  readonly agentId?: string;               // for AI-native surface
  readonly createdAt: number;
}

/** Market invocation request. */
export interface MarketInvocation {
  readonly principal: MarketPrincipal;
  readonly callName: string;
  readonly input: Record<string, unknown>;
  readonly chainContext?: {
    readonly chainId: string;
    readonly stepIndex: number;
    readonly previousOutput?: unknown;
  };
}

/** Market invocation result. */
export interface MarketInvocationResult {
  readonly success: boolean;
  readonly surface: MarketSurface;
  readonly callResult?: AgentCallResult;
  readonly creditsCharged: number;
  readonly rateLimitRemaining: number;
  readonly error?: string;
  readonly attestationHash: number;
}

/** Market discovery result for AI agents. */
export interface AIDiscoveryResult {
  readonly availableCalls: readonly {
    readonly callName: string;
    readonly description: string;
    readonly whenToUse: string;
    readonly inputSchema: readonly { name: string; type: string; required: boolean }[];
    readonly outputType: string;
    readonly costClass: CostClass;
    readonly latencyClass: LatencyClass;
    readonly reliabilityScore: number;
    readonly canChainTo: readonly string[];
  }[];
  readonly totalAvailable: number;
  readonly queryUsed: CallSearchQuery;
  readonly discoveryTimestamp: number;
}

/** Deterministic decision trace for sovereign call selection. */
export interface AIDecisionTrace {
  readonly stateMachine: readonly ['classify', 'score', 'rank', 'select'];
  readonly taskDescription: string;
  readonly normalizedTokens: readonly string[];
  readonly inferredCategories: readonly CallCategory[];
  readonly policyFlags: readonly string[];
  readonly shortlistedCalls: readonly string[];
}

/** Ranked sovereign call selection result. */
export interface AICallSelection {
  readonly rankedResults: readonly CallSearchResult[];
  readonly decisionTrace: AIDecisionTrace;
}

/** Developer SDK client configuration. */
export interface DeveloperSDKConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly version: string;
  readonly surface: 'developer';
  readonly permissions: readonly MarketPermission[];
  readonly rateLimit: number;
}

/** Enterprise call bundle. */
export interface EnterpriseBundle {
  readonly bundleId: string;
  readonly name: string;
  readonly description: string;
  readonly includedCalls: readonly string[];
  readonly monthlyCredits: number;
  readonly pricePerMonth: number;
  readonly slaGuarantee: number;           // reliability SLA
  readonly supportTier: 'standard' | 'premium' | 'dedicated';
}

// ══════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const COST_CREDITS: Record<CostClass, number> = {
  'free': 0,
  'micro': 1,
  'standard': 10,
  'premium': 100,
  'enterprise': 1000,
};

const SECURITY_ACCESS: Record<MarketSurface, readonly SecurityTier[]> = {
  'internal': ['public', 'authenticated', 'privileged', 'sovereign', 'quantum-sealed'],
  'developer': ['public', 'authenticated', 'privileged'],
  'ai-native': ['public', 'authenticated', 'privileged'],
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how', 'i',
  'in', 'into', 'is', 'it', 'of', 'on', 'or', 'our', 'that', 'the', 'this',
  'to', 'we', 'with',
]);

const CATEGORY_SIGNALS: Record<CallCategory, readonly string[]> = {
  'orchestration': ['agent', 'coordinate', 'orchestrate', 'route', 'workflow'],
  'web-intelligence': ['crawl', 'extract', 'fetch', 'index', 'scrape', 'web'],
  'rendering': ['animate', 'compose', 'image', 'raster', 'render', 'scene'],
  'data-structures': ['graph', 'index', 'query', 'spatial', 'stream', 'tree'],
  'runtime': ['execute', 'latency', 'profile', 'runtime', 'sandbox', 'schedule'],
  'model-operations': ['benchmark', 'evaluate', 'fusion', 'model', 'select', 'train'],
  'market-operations': ['audit', 'balance', 'contract', 'market', 'price'],
  'infrastructure': ['deploy', 'health', 'recover', 'scale', 'uptime'],
};

const LATENCY_PREFERENCE: Record<LatencyClass, number> = {
  'realtime': 1.0,
  'fast': 0.85,
  'standard': 0.55,
  'batch': 0.2,
  'async': 0.1,
};

const COST_PREFERENCE: Record<CostClass, number> = {
  'free': 1.0,
  'micro': 0.8,
  'standard': 0.55,
  'premium': 0.2,
  'enterprise': 0.1,
};

interface TaskSignals {
  readonly tokens: readonly string[];
  readonly inferredCategories: readonly CallCategory[];
  readonly policyFlags: readonly string[];
  readonly prefersLowLatency: boolean;
  readonly prefersLowCost: boolean;
  readonly prefersStreaming: boolean;
  readonly prefersSecureRouting: boolean;
  readonly requiresChaining: boolean;
}

function stemToken(token: string): string {
  return token
    .replace(/(ing|ers|ies|ied|ed|es|s)$/u, '')
    .replace(/[^a-z0-9]/gu, '');
}

function tokenizeTask(taskDescription: string): readonly string[] {
  return taskDescription
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .map(stemToken)
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

function inferCategories(tokens: readonly string[]): readonly CallCategory[] {
  const tokenSet = new Set(tokens);
  return (Object.entries(CATEGORY_SIGNALS) as [CallCategory, readonly string[]][])
    .filter(([, signals]) => signals.some(signal => tokenSet.has(signal)))
    .map(([category]) => category);
}

function extractTaskSignals(taskDescription: string): TaskSignals {
  const tokens = tokenizeTask(taskDescription);
  const lowered = taskDescription.toLowerCase();
  const inferred = inferCategories(tokens);
  const policyFlags = [
    /(fast|instant|quick|real[- ]?time|urgent)/u.test(lowered) ? 'prefer-low-latency' : '',
    /(cheap|budget|free|low[- ]?cost|minimal)/u.test(lowered) ? 'prefer-low-cost' : '',
    /(stream|realtime output|incremental)/u.test(lowered) ? 'prefer-streaming' : '',
    /(secure|sensitive|privileged|sovereign|private)/u.test(lowered) ? 'prefer-secure-routing' : '',
    /(chain|pipeline|sequence|multi[- ]?step|workflow)/u.test(lowered) ? 'require-chaining' : '',
  ].filter(Boolean);

  return {
    tokens,
    inferredCategories: inferred,
    policyFlags,
    prefersLowLatency: policyFlags.includes('prefer-low-latency'),
    prefersLowCost: policyFlags.includes('prefer-low-cost'),
    prefersStreaming: policyFlags.includes('prefer-streaming'),
    prefersSecureRouting: policyFlags.includes('prefer-secure-routing'),
    requiresChaining: policyFlags.includes('require-chaining'),
  };
}

function scoreCallForTask(call: RegisteredCall, signals: TaskSignals): CallSearchResult {
  const haystack = [
    call.callName,
    call.agentName,
    call.category,
    call.metadata.description,
    call.metadata.whenToUse,
    ...call.tags,
  ].join(' ').toLowerCase();

  const matchedFields = new Set<string>();
  let score = 0.75 + (call.metadata.reliabilityScore * PHI * 0.25);

  const tokenMatches = signals.tokens.filter(token => haystack.includes(token));
  if (tokenMatches.length > 0) {
    score += Math.min(tokenMatches.length * 0.45, 2.25);
    matchedFields.add('heuristic:keywords');
  }

  if (signals.inferredCategories.includes(call.category)) {
    score += 1.4;
    matchedFields.add('heuristic:category');
  }

  if (signals.prefersLowLatency) {
    score += LATENCY_PREFERENCE[call.metadata.latencyClass];
    matchedFields.add('heuristic:latency');
  }

  if (signals.prefersLowCost) {
    score += COST_PREFERENCE[call.metadata.costClass];
    matchedFields.add('heuristic:cost');
  }

  if (signals.prefersStreaming && call.metadata.streamable) {
    score += 0.55;
    matchedFields.add('heuristic:streaming');
  }

  if (signals.prefersSecureRouting) {
    score += call.metadata.securityTier === 'privileged' ? 0.6 : 0.2;
    matchedFields.add('heuristic:security');
  }

  if (signals.requiresChaining && call.metadata.allowedChainingTargets.length > 0) {
    score += 0.45;
    matchedFields.add('heuristic:chaining');
  }

  if (call.metadata.idempotent) {
    score += 0.2;
    matchedFields.add('heuristic:idempotent');
  }

  return {
    call,
    relevanceScore: Math.min(score / 7.5, 1.0),
    matchedFields: [...matchedFields],
  };
}

// ══════════════════════════════════════════════════════════════════
//  ENTERPRISE BUNDLES
// ══════════════════════════════════════════════════════════════════

export const ENTERPRISE_BUNDLES: readonly EnterpriseBundle[] = [
  {
    bundleId: 'bundle-starter',
    name: 'Nova Starter',
    description: 'Essential call bundle — web intelligence + basic orchestration',
    includedCalls: ['crawl_web', 'index_content', 'extract_data', 'manage_cache', 'orchestrate_external'],
    monthlyCredits: 10_000,
    pricePerMonth: 99,
    slaGuarantee: 0.995,
    supportTier: 'standard',
  },
  {
    bundleId: 'bundle-professional',
    name: 'Nova Professional',
    description: 'Full operations bundle — all workers + market controllers',
    includedCalls: [
      'crawl_web', 'index_content', 'extract_data', 'manage_cache', 'command_web',
      'orchestrate_external', 'integrate_partner', 'orchestrate_cloud', 'orchestrate_edge',
      'build_tree', 'build_graph', 'process_stream', 'query_spatial',
      'execute_code', 'schedule_task', 'profile_runtime', 'manage_sandbox',
      'select_model', 'fuse_models', 'evaluate_model',
      'price_call', 'audit_market', 'balance_load', 'enforce_contract',
      'monitor_health', 'auto_scale', 'deploy_artifact',
    ],
    monthlyCredits: 100_000,
    pricePerMonth: 999,
    slaGuarantee: 0.999,
    supportTier: 'premium',
  },
  {
    bundleId: 'bundle-enterprise',
    name: 'Nova Enterprise',
    description: 'Everything — all 40 agents, all calls, all commanders, unlimited chaining',
    includedCalls: REGISTERED_CALLS.map(c => c.callName),
    monthlyCredits: 1_000_000,
    pricePerMonth: 9_999,
    slaGuarantee: 0.9999,
    supportTier: 'dedicated',
  },
  {
    bundleId: 'bundle-sovereign',
    name: 'Nova Sovereign',
    description: 'Sovereign deployment — all calls running on your own substrate, quantum-sealed',
    includedCalls: REGISTERED_CALLS.map(c => c.callName),
    monthlyCredits: -1,  // unlimited
    pricePerMonth: 49_999,
    slaGuarantee: 0.99999,
    supportTier: 'dedicated',
  },
];

// ══════════════════════════════════════════════════════════════════
//  INTERNAL CALL MARKET
// ══════════════════════════════════════════════════════════════════

/**
 * Internal Call Market — Surface 1
 *
 * For our own organisms, agents, SDK organisms, and branch systems.
 * Full access to all calls.  Virtual pricing (weight-based).
 * Experimentation runs.  Internal routing.
 */
export class InternalCallMarket {
  private readonly registry: CallRegistry;
  private readonly invocationLog: MarketInvocationResult[] = [];

  constructor() {
    this.registry = new CallRegistry();
  }

  /** Get the underlying call registry. */
  getRegistry(): CallRegistry {
    return this.registry;
  }

  /** Create an internal principal (organism, agent, or branch system). */
  createPrincipal(name: string, agentId?: string): MarketPrincipal {
    return {
      principalId: `internal-${fibonacciHash(hashStr(name), 2_147_483_647)}`,
      name,
      surface: 'internal',
      permissions: ['read', 'invoke', 'chain', 'admin'],
      tier: 'enterprise',
      rateLimitPerMinute: 100_000,
      dailyBudget: -1,  // unlimited for internal
      agentId,
      createdAt: Date.now(),
    };
  }

  /** Invoke a call on the internal market. */
  invoke(request: MarketInvocation): MarketInvocationResult {
    if (request.principal.surface !== 'internal') {
      return {
        success: false,
        surface: 'internal',
        creditsCharged: 0,
        rateLimitRemaining: 0,
        error: 'Only internal principals can use the internal market',
        attestationHash: 0,
      };
    }

    const callResult = this.registry.invoke(request.callName, request.input);
    const credits = COST_CREDITS[callResult.costClass];

    const result: MarketInvocationResult = {
      success: true,
      surface: 'internal',
      callResult,
      creditsCharged: credits,
      rateLimitRemaining: request.principal.rateLimitPerMinute - 1,
      attestationHash: fibonacciHash(hashStr(request.callName + JSON.stringify(request.input)), 2_147_483_647),
    };

    this.invocationLog.push(result);
    return result;
  }

  /** Get invocation log for auditing. */
  getLog(): readonly MarketInvocationResult[] {
    return this.invocationLog;
  }
}

// ══════════════════════════════════════════════════════════════════
//  DEVELOPER CALL MARKET
// ══════════════════════════════════════════════════════════════════

/**
 * Developer Call Market — Surface 2
 *
 * For outside builders.  Callable SDKs.  Registry browsing.
 * API keys / principals / permission paths.
 * Standard call contracts.  Docs + examples.
 */
export class DeveloperCallMarket {
  private readonly registry: CallRegistry;
  private readonly principals: Map<string, MarketPrincipal> = new Map();
  private readonly usageTracker: Map<string, number> = new Map();

  constructor() {
    this.registry = new CallRegistry();
  }

  /** Get the underlying call registry. */
  getRegistry(): CallRegistry {
    return this.registry;
  }

  /** Register a developer principal with an API key. */
  registerDeveloper(name: string, tier: CostClass = 'standard'): MarketPrincipal {
    const apiKey = `nova-dev-${fibonacciHash(hashStr(name + Date.now()), 2_147_483_647)}`;
    const rateLimit = tier === 'enterprise' ? 10_000 : tier === 'premium' ? 5_000 : tier === 'standard' ? 1_000 : 100;
    const budget = tier === 'enterprise' ? 1_000_000 : tier === 'premium' ? 100_000 : tier === 'standard' ? 10_000 : 1_000;

    const principal: MarketPrincipal = {
      principalId: `dev-${fibonacciHash(hashStr(name), 2_147_483_647)}`,
      name,
      surface: 'developer',
      permissions: ['read', 'invoke', 'chain'],
      tier,
      rateLimitPerMinute: rateLimit,
      dailyBudget: budget,
      apiKey,
      createdAt: Date.now(),
    };

    this.principals.set(apiKey, principal);
    return principal;
  }

  /** Authenticate a developer by API key. */
  authenticate(apiKey: string): MarketPrincipal | undefined {
    return this.principals.get(apiKey);
  }

  /** Browse available calls (read permission only). */
  browseCalls(query?: CallSearchQuery): readonly CallSearchResult[] {
    return this.registry.search(query ?? {});
  }

  /** Get SDK configuration for a developer. */
  getSDKConfig(apiKey: string): DeveloperSDKConfig | undefined {
    const principal = this.principals.get(apiKey);
    if (!principal) return undefined;

    return {
      apiKey,
      baseUrl: 'https://api.nova-protocol.ai/v1',
      version: '1.0.0',
      surface: 'developer',
      permissions: [...principal.permissions],
      rateLimit: principal.rateLimitPerMinute,
    };
  }

  /** Invoke a call as a developer. */
  invoke(apiKey: string, callName: string, input: Record<string, unknown>): MarketInvocationResult {
    const principal = this.principals.get(apiKey);
    if (!principal) {
      return {
        success: false,
        surface: 'developer',
        creditsCharged: 0,
        rateLimitRemaining: 0,
        error: 'Invalid API key',
        attestationHash: 0,
      };
    }

    // Check security tier access
    const call = this.registry.getCall(callName);
    if (!call) {
      return {
        success: false,
        surface: 'developer',
        creditsCharged: 0,
        rateLimitRemaining: principal.rateLimitPerMinute,
        error: `Call '${callName}' not found`,
        attestationHash: 0,
      };
    }

    const allowedTiers = SECURITY_ACCESS['developer'];
    if (!allowedTiers.includes(call.metadata.securityTier)) {
      return {
        success: false,
        surface: 'developer',
        creditsCharged: 0,
        rateLimitRemaining: principal.rateLimitPerMinute,
        error: `Call '${callName}' requires security tier '${call.metadata.securityTier}' — not available on developer surface`,
        attestationHash: 0,
      };
    }

    // Track usage
    const currentUsage = this.usageTracker.get(principal.principalId) ?? 0;
    const credits = COST_CREDITS[call.metadata.costClass];

    if (principal.dailyBudget > 0 && currentUsage + credits > principal.dailyBudget) {
      return {
        success: false,
        surface: 'developer',
        creditsCharged: 0,
        rateLimitRemaining: 0,
        error: 'Daily budget exceeded',
        attestationHash: 0,
      };
    }

    this.usageTracker.set(principal.principalId, currentUsage + credits);
    const callResult = this.registry.invoke(callName, input);

    return {
      success: true,
      surface: 'developer',
      callResult,
      creditsCharged: credits,
      rateLimitRemaining: principal.rateLimitPerMinute - 1,
      attestationHash: fibonacciHash(hashStr(callName + JSON.stringify(input)), 2_147_483_647),
    };
  }

  /** Get available enterprise bundles. */
  getBundles(): readonly EnterpriseBundle[] {
    return ENTERPRISE_BUNDLES;
  }
}

// ══════════════════════════════════════════════════════════════════
//  AI-NATIVE CALL MARKET
// ══════════════════════════════════════════════════════════════════

/**
 * AI-Native Call Market — Surface 3
 *
 * AI agents can discover calls.  Choose a call.  Invoke a call.
 * Receive structured output.  Chain calls together.
 *
 * This is the market surface where machine-readable metadata powers
 * autonomous tool selection and multi-step call chaining.
 */
export class AINativeCallMarket {
  private readonly registry: CallRegistry;
  private readonly agentPrincipals: Map<string, MarketPrincipal> = new Map();

  constructor() {
    this.registry = new CallRegistry();
  }

  /** Get the underlying call registry. */
  getRegistry(): CallRegistry {
    return this.registry;
  }

  /** Register an AI agent principal. */
  registerAgent(agentId: string, agentName: string, tier: CostClass = 'standard'): MarketPrincipal {
    const rateLimit = tier === 'enterprise' ? 50_000 : tier === 'premium' ? 10_000 : tier === 'standard' ? 2_000 : 500;

    const principal: MarketPrincipal = {
      principalId: `ai-${fibonacciHash(hashStr(agentId), 2_147_483_647)}`,
      name: agentName,
      surface: 'ai-native',
      permissions: ['read', 'invoke', 'chain'],
      tier,
      rateLimitPerMinute: rateLimit,
      dailyBudget: tier === 'enterprise' ? -1 : tier === 'premium' ? 500_000 : 50_000,
      agentId,
      createdAt: Date.now(),
    };

    this.agentPrincipals.set(agentId, principal);
    return principal;
  }

  /**
   * DISCOVER — The core AI discovery interface.
   *
   * AI agents call this to learn what tools are available.
   * Returns machine-readable call metadata optimized for agent consumption.
   */
  discover(query: CallSearchQuery = {}): AIDiscoveryResult {
    const results = this.registry.search(query);

    return {
      availableCalls: results.map(r => ({
        callName: r.call.callName,
        description: r.call.metadata.description,
        whenToUse: r.call.metadata.whenToUse,
        inputSchema: r.call.metadata.requiredInputs.map(i => ({
          name: i.name,
          type: i.type,
          required: i.required,
        })),
        outputType: r.call.metadata.outputType,
        costClass: r.call.metadata.costClass,
        latencyClass: r.call.metadata.latencyClass,
        reliabilityScore: r.call.metadata.reliabilityScore,
        canChainTo: [...r.call.metadata.allowedChainingTargets],
      })),
      totalAvailable: results.length,
      queryUsed: query,
      discoveryTimestamp: Date.now(),
    };
  }

  /**
   * CHOOSE — Help an AI agent select the best call for its task.
   *
   * Uses a sovereign, deterministic classify → score → rank → select
   * heuristic pipeline with no external LLM dependency.
   */
  choose(taskDescription: string, maxResults: number = 5): readonly CallSearchResult[] {
    return this.chooseWithTrace(taskDescription, maxResults).rankedResults;
  }

  /** Explain how the sovereign heuristic selected calls for a task. */
  chooseWithTrace(taskDescription: string, maxResults: number = 5): AICallSelection {
    const signals = extractTaskSignals(taskDescription);
    const rankedResults = this.registry
      .listAll()
      .map(call => scoreCallForTask(call, signals))
      .sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return b.call.metadata.reliabilityScore - a.call.metadata.reliabilityScore;
      })
      .slice(0, maxResults);

    return {
      rankedResults,
      decisionTrace: {
        stateMachine: ['classify', 'score', 'rank', 'select'],
        taskDescription,
        normalizedTokens: signals.tokens,
        inferredCategories: signals.inferredCategories,
        policyFlags: signals.policyFlags,
        shortlistedCalls: rankedResults.map(result => result.call.callName),
      },
    };
  }

  /**
   * INVOKE — Execute a call as an AI agent.
   */
  invoke(agentId: string, callName: string, input: Record<string, unknown>): MarketInvocationResult {
    const principal = this.agentPrincipals.get(agentId);
    if (!principal) {
      return {
        success: false,
        surface: 'ai-native',
        creditsCharged: 0,
        rateLimitRemaining: 0,
        error: `Agent '${agentId}' not registered`,
        attestationHash: 0,
      };
    }

    const call = this.registry.getCall(callName);
    if (!call) {
      return {
        success: false,
        surface: 'ai-native',
        creditsCharged: 0,
        rateLimitRemaining: principal.rateLimitPerMinute,
        error: `Call '${callName}' not found`,
        attestationHash: 0,
      };
    }

    const allowedTiers = SECURITY_ACCESS['ai-native'];
    if (!allowedTiers.includes(call.metadata.securityTier)) {
      return {
        success: false,
        surface: 'ai-native',
        creditsCharged: 0,
        rateLimitRemaining: principal.rateLimitPerMinute,
        error: `Call '${callName}' requires security tier '${call.metadata.securityTier}' — not available on AI-native surface`,
        attestationHash: 0,
      };
    }

    const callResult = this.registry.invoke(callName, input);
    const credits = COST_CREDITS[callResult.costClass];

    return {
      success: true,
      surface: 'ai-native',
      callResult,
      creditsCharged: credits,
      rateLimitRemaining: principal.rateLimitPerMinute - 1,
      attestationHash: fibonacciHash(hashStr(callName + JSON.stringify(input)), 2_147_483_647),
    };
  }

  /**
   * CHAIN — Execute a sequence of calls, passing output to input.
   */
  chain(agentId: string, callNames: readonly string[], initialInput: Record<string, unknown>): {
    readonly success: boolean;
    readonly chain: CallChain;
    readonly results: readonly MarketInvocationResult[];
    readonly finalOutput: unknown;
  } {
    const validation = this.registry.validateChain(callNames);
    if (!validation.valid) {
      return {
        success: false,
        chain: this.registry.buildChain(callNames),
        results: [],
        finalOutput: { error: 'Chain validation failed', details: validation.errors },
      };
    }

    const chain = this.registry.buildChain(callNames);
    const results: MarketInvocationResult[] = [];
    let currentInput = initialInput;

    for (const callName of callNames) {
      const result = this.invoke(agentId, callName, currentInput);
      results.push(result);

      if (!result.success) {
        return { success: false, chain, results, finalOutput: { error: result.error } };
      }

      // Pass output as input to next step
      currentInput = { previousOutput: result.callResult?.output, originalInput: initialInput };
    }

    return {
      success: true,
      chain,
      results,
      finalOutput: results[results.length - 1]?.callResult?.output,
    };
  }

  /** Get all registered AI agent principals. */
  listAgents(): readonly MarketPrincipal[] {
    return [...this.agentPrincipals.values()];
  }
}

// ══════════════════════════════════════════════════════════════════
//  UNIFIED CALL MARKET — All Three Surfaces
// ══════════════════════════════════════════════════════════════════

/**
 * The Unified Call Market — three parallel surfaces, one registry.
 *
 * Usage:
 *   const market = new CallMarket();
 *
 *   // Internal surface
 *   const internal = market.internal;
 *   const org = internal.createPrincipal('Observer Organism');
 *   internal.invoke({ principal: org, callName: 'crawl_web', input: { seed_urls: ['...'] } });
 *
 *   // Developer surface
 *   const dev = market.developer;
 *   const devPrincipal = dev.registerDeveloper('Acme Corp', 'premium');
 *   dev.invoke(devPrincipal.apiKey!, 'select_model', { task_description: '...', requirements: {} });
 *
 *   // AI-native surface
 *   const ai = market.aiNative;
 *   ai.registerAgent('nova-alpha-01', 'Nova Sovereign Agent', 'premium');
 *   const discovery = ai.discover({ category: 'model-operations' });
 *   ai.invoke('nova-alpha-01', 'select_model', { task_description: '...', requirements: {} });
 */
export class CallMarket {
  /** Surface 1: Internal Call Market */
  readonly internal: InternalCallMarket;

  /** Surface 2: Developer Call Market */
  readonly developer: DeveloperCallMarket;

  /** Surface 3: AI-Native Call Market */
  readonly aiNative: AINativeCallMarket;

  constructor() {
    this.internal = new InternalCallMarket();
    this.developer = new DeveloperCallMarket();
    this.aiNative = new AINativeCallMarket();
  }

  /** Get market statistics across all surfaces. */
  stats(): {
    totalCalls: number;
    surfaces: readonly { surface: MarketSurface; description: string }[];
    bundles: number;
    registryStats: ReturnType<CallRegistry['stats']>;
  } {
    return {
      totalCalls: REGISTERED_CALLS.length,
      surfaces: [
        { surface: 'internal', description: 'Internal organisms, agents, and branch systems — full access, virtual pricing' },
        { surface: 'developer', description: 'Outside builders — SDK access, API keys, standard contracts, tiered pricing' },
        { surface: 'ai-native', description: 'AI agents — machine-readable discovery, autonomous invocation, call chaining' },
      ],
      bundles: ENTERPRISE_BUNDLES.length,
      registryStats: this.internal.getRegistry().stats(),
    };
  }
}
