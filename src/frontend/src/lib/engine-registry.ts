/**
 * NOVA Multi-Engine Registry & Dispatch
 *
 * Unified interface for JavaScript, Python, Julia, and zero-cost engines.
 * Each engine runs locally or via ICP canister, producing φ-weighted results.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { PHI } from '../store/nova-store';

// ─── Engine Types ────────────────────────────────────────────────────────────

export type EngineLanguage = 'javascript' | 'python' | 'julia' | 'motoko' | 'rust' | 'haskell' | 'lean4' | 'coq' | 'agda' | 'idris2' | 'fsharp';

export type EngineCategory =
  | 'computation'    // Math/logic engines
  | 'governance'     // Law & protocol engines
  | 'organism'       // Biological/runtime engines
  | 'verification'   // Proof/type engines (zero-cost)
  | 'ai'            // AI/ML inference engines
  | 'bridge';       // Cross-language bridge engines

export type EngineStatus = 'online' | 'offline' | 'warming' | 'error' | 'degraded';

export interface EngineCapability {
  id: string;
  name: string;
  description: string;
  inputSchema?: Record<string, string>;
  outputSchema?: Record<string, string>;
}

export interface Engine {
  id: string;
  name: string;
  language: EngineLanguage;
  category: EngineCategory;
  version: string;
  status: EngineStatus;
  capabilities: EngineCapability[];
  phiWeight: number;         // φ-priority weight
  latencyMs: number;         // Average response time
  throughput: number;        // Requests per second
  lastHeartbeat: number;     // Last heartbeat timestamp
  description: string;
  endpoint?: string;         // Canister ID or URL
}

export interface EngineRequest {
  engineId: string;
  capability: string;
  input: Record<string, unknown>;
  priority?: number;         // φ-weighted priority (0=highest)
  timeout?: number;          // ms
}

export interface EngineResponse {
  requestId: string;
  engineId: string;
  success: boolean;
  data: unknown;
  error?: string;
  executionTimeMs: number;
  biorhythm: number;
  phiConfidence: number;     // φ-weighted confidence score
}

// ─── Engine Registry ─────────────────────────────────────────────────────────

export const ENGINES: Engine[] = [
  // JavaScript Engines
  {
    id: 'js-bridge',
    name: 'NOVA JavaScript Bridge',
    language: 'javascript',
    category: 'organism',
    version: '1.0.0',
    status: 'online',
    capabilities: [
      { id: 'biorhythm', name: 'Biorhythm Calculation', description: 'Ancient calendar φ-derived biorhythm' },
      { id: 'heartbeat', name: 'BiologicalHeart', description: '873ms φ-heartbeat management' },
      { id: 'cil', name: 'CIL Processing', description: 'Cognitive Internal Language processing' },
    ],
    phiWeight: PHI,
    latencyMs: 12,
    throughput: 850,
    lastHeartbeat: Date.now(),
    description: 'Self-bootstrapping organism runtime with BiologicalHeart integration',
  },

  // Python Engines
  {
    id: 'py-bridge',
    name: 'NOVA Python Bridge',
    language: 'python',
    category: 'bridge',
    version: '1.0.0',
    status: 'online',
    capabilities: [
      { id: 'engine-dispatch', name: 'Engine Dispatch', description: 'Route tasks to Julia engines' },
      { id: 'async-orchestration', name: 'Async Orchestration', description: 'Asyncio-based task orchestration' },
      { id: 'websocket-api', name: 'WebSocket API', description: 'Real-time engine access via WS' },
    ],
    phiWeight: PHI * PHI,
    latencyMs: 45,
    throughput: 320,
    lastHeartbeat: Date.now(),
    description: 'Integration layer between Julia engines and Python services',
  },
  {
    id: 'py-sanskrit',
    name: 'Sanskrit Protocol Engine',
    language: 'python',
    category: 'computation',
    version: '0.9.0',
    status: 'online',
    capabilities: [
      { id: 'grammar-parse', name: 'Grammar Parsing', description: 'Sanskrit grammar-based protocol parsing' },
      { id: 'sutra-eval', name: 'Sutra Evaluation', description: 'Evaluate protocol rules as sutras' },
    ],
    phiWeight: PHI,
    latencyMs: 78,
    throughput: 200,
    lastHeartbeat: Date.now(),
    description: 'Sanskrit-inspired protocol definition and evaluation',
  },

  // Julia Engines
  {
    id: 'jl-law',
    name: 'CPL Law Engine',
    language: 'julia',
    category: 'governance',
    version: '2.1.0',
    status: 'online',
    capabilities: [
      { id: 'law-evaluate', name: 'Law Evaluation', description: 'Evaluate entity compliance against CPL laws' },
      { id: 'law-propose', name: 'Law Proposal', description: 'Generate new law proposals' },
      { id: 'law-conflict', name: 'Conflict Detection', description: 'Detect conflicting law clauses' },
    ],
    phiWeight: PHI * PHI * PHI,
    latencyMs: 150,
    throughput: 120,
    lastHeartbeat: Date.now(),
    description: 'CPL-L Law Engine for governance evaluation and enforcement',
  },
  {
    id: 'jl-pipeline',
    name: 'CPL Pipeline Engine',
    language: 'julia',
    category: 'computation',
    version: '2.1.0',
    status: 'online',
    capabilities: [
      { id: 'pipeline-run', name: 'Pipeline Execution', description: 'Execute CPL pipelines with full context' },
      { id: 'pipeline-validate', name: 'Pipeline Validation', description: 'Validate pipeline DAG structure' },
      { id: 'pipeline-optimize', name: 'Pipeline Optimization', description: 'φ-weighted pipeline optimization' },
    ],
    phiWeight: PHI * PHI,
    latencyMs: 200,
    throughput: 80,
    lastHeartbeat: Date.now(),
    description: 'CPL-P Pipeline Engine for composable computation graphs',
  },
  {
    id: 'jl-organism',
    name: 'Organism Runtime Engine',
    language: 'julia',
    category: 'organism',
    version: '2.1.0',
    status: 'online',
    capabilities: [
      { id: 'org-task', name: 'Task Execution', description: 'Execute organism-scoped tasks' },
      { id: 'org-biorhythm', name: 'Biorhythm', description: 'Calculate organism biorhythm' },
      { id: 'org-lifecycle', name: 'Lifecycle Management', description: 'Manage organism lifecycle states' },
    ],
    phiWeight: PHI * PHI,
    latencyMs: 95,
    throughput: 180,
    lastHeartbeat: Date.now(),
    description: 'Organism runtime with φ-heartbeat and lifecycle management',
  },
  {
    id: 'jl-governance',
    name: 'Atlas Governance Engine',
    language: 'julia',
    category: 'governance',
    version: '2.1.0',
    status: 'online',
    capabilities: [
      { id: 'gov-cycle', name: 'Governance Cycle', description: 'Execute full governance cycle' },
      { id: 'gov-vote', name: 'Vote Aggregation', description: 'φ-weighted vote aggregation' },
      { id: 'gov-consensus', name: 'Consensus Building', description: 'Multi-agent consensus resolution' },
    ],
    phiWeight: PHI * PHI * PHI,
    latencyMs: 250,
    throughput: 60,
    lastHeartbeat: Date.now(),
    description: 'Atlas governance with sovereign decision-making',
  },
  {
    id: 'jl-numerical',
    name: 'Numerical Bridge',
    language: 'julia',
    category: 'computation',
    version: '1.5.0',
    status: 'online',
    capabilities: [
      { id: 'matrix-ops', name: 'Matrix Operations', description: 'High-performance linear algebra' },
      { id: 'fft', name: 'FFT/Signal Processing', description: 'Fast Fourier transform and signal analysis' },
      { id: 'optimization', name: 'Optimization', description: 'Convex and non-convex optimization solvers' },
    ],
    phiWeight: PHI,
    latencyMs: 35,
    throughput: 500,
    lastHeartbeat: Date.now(),
    description: 'High-performance numerical computation bridge',
  },
  {
    id: 'jl-mindstack',
    name: 'MindStack Engine',
    language: 'julia',
    category: 'ai',
    version: '1.2.0',
    status: 'online',
    capabilities: [
      { id: 'reasoning', name: 'Structured Reasoning', description: 'Multi-agent structured reasoning pipeline' },
      { id: 'inference', name: 'Local Inference', description: 'On-chain inference with φ-confidence' },
      { id: 'embedding', name: 'Embedding Generation', description: 'Generate semantic embeddings' },
    ],
    phiWeight: PHI * PHI * PHI * PHI,
    latencyMs: 300,
    throughput: 40,
    lastHeartbeat: Date.now(),
    description: 'AI reasoning and inference engine with φ-mathematics',
  },
  {
    id: 'jl-socialstack',
    name: 'SocialStack Engine',
    language: 'julia',
    category: 'ai',
    version: '1.0.0',
    status: 'online',
    capabilities: [
      { id: 'sentiment', name: 'Sentiment Analysis', description: 'φ-weighted sentiment scoring' },
      { id: 'trust-graph', name: 'Trust Graph', description: 'Social trust graph computation' },
      { id: 'reputation', name: 'Reputation Scoring', description: 'Decentralized reputation calculation' },
    ],
    phiWeight: PHI * PHI,
    latencyMs: 180,
    throughput: 100,
    lastHeartbeat: Date.now(),
    description: 'Social intelligence and trust computation',
  },

  // Zero-Cost Verification Engines
  {
    id: 'zc-lean4',
    name: 'Lean4 Proof Engine',
    language: 'lean4',
    category: 'verification',
    version: '4.0.0',
    status: 'online',
    capabilities: [
      { id: 'theorem-prove', name: 'Theorem Proving', description: 'Formal theorem verification' },
      { id: 'type-check', name: 'Type Checking', description: 'Dependent type validation' },
    ],
    phiWeight: PHI * PHI * PHI,
    latencyMs: 500,
    throughput: 20,
    lastHeartbeat: Date.now(),
    description: 'Formal verification via Lean4 proof assistant',
  },
  {
    id: 'zc-haskell',
    name: 'Haskell Type Engine',
    language: 'haskell',
    category: 'verification',
    version: '9.6.0',
    status: 'online',
    capabilities: [
      { id: 'type-infer', name: 'Type Inference', description: 'Hindley-Milner type inference' },
      { id: 'purity-check', name: 'Purity Check', description: 'Verify referential transparency' },
    ],
    phiWeight: PHI * PHI,
    latencyMs: 120,
    throughput: 150,
    lastHeartbeat: Date.now(),
    description: 'Pure functional type system verification',
  },
  {
    id: 'zc-coq',
    name: 'Coq Proof Engine',
    language: 'coq',
    category: 'verification',
    version: '8.18.0',
    status: 'online',
    capabilities: [
      { id: 'formal-verify', name: 'Formal Verification', description: 'Calculus of Constructions verification' },
      { id: 'extract', name: 'Program Extraction', description: 'Extract certified programs from proofs' },
    ],
    phiWeight: PHI * PHI * PHI,
    latencyMs: 800,
    throughput: 10,
    lastHeartbeat: Date.now(),
    description: 'Coq proof assistant for certified computation',
  },

  // Motoko/ICP Engines
  {
    id: 'mo-brain',
    name: 'Brain Canister',
    language: 'motoko',
    category: 'ai',
    version: '1.0.0',
    status: 'online',
    capabilities: [
      { id: 'on-chain-inference', name: 'On-Chain Inference', description: 'AI inference directly on ICP' },
      { id: 'memory-state', name: 'Memory State', description: 'Persistent AI memory management' },
    ],
    phiWeight: PHI * PHI * PHI * PHI,
    latencyMs: 2000,
    throughput: 5,
    lastHeartbeat: Date.now(),
    description: 'On-chain AI brain with persistent state on ICP',
  },
  {
    id: 'mo-cordex',
    name: 'Cordex Engine',
    language: 'motoko',
    category: 'organism',
    version: '1.0.0',
    status: 'online',
    capabilities: [
      { id: 'kuramoto-sync', name: 'Kuramoto Sync', description: 'Multi-oscillator synchronization' },
      { id: 'phase-coupling', name: 'Phase Coupling', description: 'φ-weighted phase coupling between organisms' },
    ],
    phiWeight: PHI * PHI,
    latencyMs: 500,
    throughput: 30,
    lastHeartbeat: Date.now(),
    description: 'Coordination engine using Kuramoto oscillator model',
  },
];

// ─── Registry Functions ──────────────────────────────────────────────────────

export function getEnginesByCategory(category: EngineCategory): Engine[] {
  return ENGINES.filter(e => e.category === category);
}

export function getEnginesByLanguage(language: EngineLanguage): Engine[] {
  return ENGINES.filter(e => e.language === language);
}

export function getEngineById(id: string): Engine | undefined {
  return ENGINES.find(e => e.id === id);
}

export function getOnlineEngines(): Engine[] {
  return ENGINES.filter(e => e.status === 'online');
}

export function getAllCapabilities(): EngineCapability[] {
  return ENGINES.flatMap(e => e.capabilities.map(c => ({ ...c, id: `${e.id}:${c.id}` })));
}

/** Get engines sorted by φ-weight (highest priority first) */
export function getEnginesByPriority(): Engine[] {
  return [...ENGINES].sort((a, b) => b.phiWeight - a.phiWeight);
}

/** Find best engine for a given capability */
export function findBestEngine(capabilityId: string): Engine | undefined {
  const candidates = ENGINES.filter(e =>
    e.status === 'online' && e.capabilities.some(c => c.id === capabilityId)
  );
  // Sort by φ-weight × (1/latency) — highest = best
  return candidates.sort((a, b) =>
    (b.phiWeight / b.latencyMs) - (a.phiWeight / a.latencyMs)
  )[0];
}

/** Calculate aggregate engine health */
export function calculateEngineHealth(): number {
  const online = ENGINES.filter(e => e.status === 'online').length;
  return online / ENGINES.length;
}

/** Get engine stats summary */
export function getEngineStats() {
  const online = ENGINES.filter(e => e.status === 'online').length;
  const totalCapabilities = ENGINES.reduce((sum, e) => sum + e.capabilities.length, 0);
  const avgLatency = ENGINES.reduce((sum, e) => sum + e.latencyMs, 0) / ENGINES.length;
  const totalThroughput = ENGINES.filter(e => e.status === 'online').reduce((sum, e) => sum + e.throughput, 0);
  const languages = new Set(ENGINES.map(e => e.language));

  return {
    totalEngines: ENGINES.length,
    onlineEngines: online,
    totalCapabilities,
    avgLatencyMs: Math.round(avgLatency),
    totalThroughput,
    languages: languages.size,
    health: calculateEngineHealth(),
  };
}
