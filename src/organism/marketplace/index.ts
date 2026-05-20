///
/// MARKETPLACE INDEX — AI-Centered Marketplace Releases
///
/// The NOVA Marketplace is not a component library.  It is not a tool set.
/// It is an AI WORKFORCE — 150 AIs with 450 engines, coordinated
/// by an AGI orchestrator, rendering through a generative UI engine backed
/// by an infinite spatial canvas.
///
/// Release #1: @medina/generative-ui-engine + Spatial Canvas
///   AI generates entire UI components in real-time from natural language.
///   Spatial canvas is wired IN — it IS the rendering substrate.
///   WebGPU + CSS Houdini + Web Components + Canvas 2D/WebGL + CRDT.
///
/// Release #2: @medina/ai-workforce (50 Language AIs + Orchestrator)
///   Every programming language IS an AI.  Each AI has 3 engines.
///   10 multi-group AI models.  AGI orchestrator manages the full build.
///   Data platform managed by AGIs.  AIs are internal workers.
///
/// Release #3: @medina/native-nova-ais (100 Native Nova AIs)
///   OUR AIs — sovereign, not wrappers.  10 per group × 10 groups.
///   Intelligence tiers: SingleModel, MultiModel, SuperIntelligent, AGI.
///   Each has 3 engines (Perceive, Synthesize, Manifest).
///   100 AIs, 300 engines, 10 AGIs, 30 self-improving.
///

// ══════════════════════════════════════════════════════════════════
//  @medina/generative-ui-engine (with Spatial Canvas wired in)
// ══════════════════════════════════════════════════════════════════

export {
  GenerativeUIEngine,
  createGenerativeUIEngine,
} from './GenerativeUIEngine.js';

export type {
  UIIntent,
  ComponentSpec,
  LayoutSpec,
  StyleRule,
  EventBinding,
  SlotDefinition,
  ASTNodeKind,
  ASTNode,
  GeneratedComponent,
  ShaderConfig,
  PaintWorklet,
  RenderPipeline,
  GenerativeUIConfig,
  DesignSystemConfig,
} from './GenerativeUIEngine.js';

// ══════════════════════════════════════════════════════════════════
//  Spatial Canvas (wired into generative-ui-engine as substrate)
// ══════════════════════════════════════════════════════════════════

export {
  SpatialCanvasSDK,
  createSpatialCanvasSDK,
} from './SpatialCanvasSDK.js';

export type {
  Point2D,
  BoundingBox,
  Transform2D,
  ViewportState,
  CanvasElementKind,
  CanvasStyle,
  CanvasElement,
  AgentKind,
  AgentAction,
  CanvasAgent,
  AgentGenerationResult,
  CRDTOperation,
  SyncState,
  SpatialCanvasConfig,
} from './SpatialCanvasSDK.js';

// ══════════════════════════════════════════════════════════════════
//  50 Language AI Workers — Every Language IS an AI
// ══════════════════════════════════════════════════════════════════

export {
  LANGUAGE_AIS,
  MULTI_GROUP_MODELS,
  LANGUAGE_AI_GROUP_INDEX,
  LanguageAIRegistry,
} from './LanguageAIWorkers.js';

export type {
  EngineKind,
  LanguageEngine,
  LanguageAIGroup,
  AIBuildRole,
  AITier,
  AIWorkerStatus,
  LanguageAI,
  MultiGroupAIModel,
  LanguageAIResult,
} from './LanguageAIWorkers.js';

// ══════════════════════════════════════════════════════════════════
//  AI Workforce Orchestrator — AGI Build Platform
// ══════════════════════════════════════════════════════════════════

export {
  AIWorkforceOrchestrator,
  createAIWorkforceOrchestrator,
} from './AIWorkforceOrchestrator.js';

export type {
  BuildIntent,
  AITask,
  PipelineStage,
  BuildPipeline,
  AIMemoryEntry,
  WorkforceStats,
} from './AIWorkforceOrchestrator.js';

// ══════════════════════════════════════════════════════════════════
//  100 Native Nova AIs — OUR Sovereign Intelligence Models
// ══════════════════════════════════════════════════════════════════

export {
  NATIVE_NOVA_AIS,
  NOVA_AI_GROUPS,
  NativeNovaAIRegistry,
} from './NativeNovaAIs.js';

export type {
  NovaEngineKind,
  NovaIntelligenceTier,
  NovaOperationalMode,
  NovaAIStatus,
  NovaEngine,
  NativeNovaAI,
  NovaAIGroup,
  NovaAIResult,
} from './NativeNovaAIs.js';
