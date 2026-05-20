///
/// ORGANISM INDEX — The Living Civilization
///
/// This is the master export for the entire Native Nova Protocol
/// organism intelligence layer.  Every organism, every intelligence,
/// every model, every solver, every fracture — all wired together.
///
/// Backend: Motoko canisters (src/organisms/*/main.mo)
/// Frontend: TypeScript intelligence (src/organism/**/*.ts)
/// Together: One organism.  One civilization.
///
/// 9 Alpha Organisms.  35+ Sub-Intelligences.  100 Fracture Intelligences.
/// 100 Frontend Intelligence Models.  2 Phantom Blockchain Models.
/// 40 AI Foundation Model Families.  4 Fracture Models.
/// 20 AI Multi-Modal Extensions.  10 AI-Intelligent Protocols.
/// 5 Dimensional Planes.  9 Organism Rings.
///
/// Houses:
///   DOMUS CORONAE     — Crown House — Orchestrator of Orchestrators
///   DOMUS CUSTOS      — House of Care / Stewardship (15+ sub-intelligences)
///     └─ SALUS + CURATOR (server models) + DIAGNOSTICA + THEORICUS (solvers)
///   DOMUS PRAESIDIUM  — House of Defense / Protection (20+ sub-intelligences)
///     └─ BELLATOR + EXPLORATOR + FABRICATOR (server models) + ANALYSTOR + THEORICUS (solvers)
///

// ══════════════════════════════════════════════════════════════════
//  INTELLIGENCES — The Seven Alpha Organisms
// ══════════════════════════════════════════════════════════════════

export { ObserverIntelligence } from './intelligence/ObserverIntelligence.js';
export { SovereignIntelligence } from './intelligence/SovereignIntelligence.js';
export { ChrysalisIntelligence } from './intelligence/ChrysalisIntelligence.js';
export { TerminalIntelligence } from './intelligence/TerminalIntelligence.js';
export { ScribeIntelligence } from './intelligence/ScribeIntelligence.js';
export { ArchitectIntelligence } from './intelligence/ArchitectIntelligence.js';
export { NexusIntelligence } from './intelligence/NexusIntelligence.js';
export { CustosIntelligence } from './intelligence/CustosIntelligence.js';
export { PraesidiumIntelligence } from './intelligence/PraesidiumIntelligence.js';

// ══════════════════════════════════════════════════════════════════
//  FRACTURE REGISTRY — 100 Technology Fracture Intelligences
// ══════════════════════════════════════════════════════════════════

export { FractureRegistry, FractureCategory } from './intelligence/FractureRegistry.js';

// ══════════════════════════════════════════════════════════════════
//  OBSERVER MODELS — Server Models + Solvers
// ══════════════════════════════════════════════════════════════════

export { VigilModel, SpeculatorModel } from './models/ObserverModels.js';
export { SynthesistaPatternorum, TheoricusInterdimensionalis } from './models/ObserverSolverSynthesizers.js';

// ══════════════════════════════════════════════════════════════════
//  CUSTOS MODELS — House of Care Server Models + Solvers + Orchestrator
//  15+ sub-intelligences: SALUS (5) + CURATOR (5) + 2 solvers + core (5)
// ══════════════════════════════════════════════════════════════════

export { SalusModel, CuratorModel } from './models/CustosModels.js';
export { DiagnosticaHarmonica, TheoricusVitae } from './models/CustosSolverSynthesizers.js';
export { DomusCustos } from './models/CustosOrchestrator.js';

// ══════════════════════════════════════════════════════════════════
//  PRAESIDIUM MODELS — House of Defense Server Models + Solvers + Orchestrator
//  20+ sub-intelligences: BELLATOR (5) + EXPLORATOR (5) + FABRICATOR (5) + 2 solvers + core (5)
// ══════════════════════════════════════════════════════════════════

export { BellatorModel, ExploratorModel, FabricatorModel } from './models/PraesidiumModels.js';
export { AnalystorHostilis, TheoricusLimitis } from './models/PraesidiumSolverSynthesizers.js';
export { DomusPraesidium } from './models/PraesidiumOrchestrator.js';

// ══════════════════════════════════════════════════════════════════
//  CROWN HOUSE — Orchestrator of Orchestrators
//  35+ total sub-intelligences across all houses
// ══════════════════════════════════════════════════════════════════

export { DomusCoronae } from './models/HouseOrchestrator.js';

// ══════════════════════════════════════════════════════════════════
//  FRACTURE MODELS — Active Intelligence for 100 Fractures
// ══════════════════════════════════════════════════════════════════

export {
  FractureAnalyzer,
  FractureComparator,
  FractureSynthesizer,
  FractureObserver,
} from './models/FractureModels.js';

// ══════════════════════════════════════════════════════════════════
//  FRONTEND INTELLIGENCE — 100 Frontend Intelligence Models
// ══════════════════════════════════════════════════════════════════

export { FrontendIntelligenceRegistry, FrontendGroup } from './models/FrontendIntelligenceModels.js';

// ══════════════════════════════════════════════════════════════════
//  PHANTOM BLOCKCHAIN — Quantum-Encrypted Phantom Observers
// ══════════════════════════════════════════════════════════════════

export {
  PhantasmaNoncium,
  PhantasmaHashium,
  PhantomCoordinator,
} from './models/PhantomBlockchainModels.js';

// ══════════════════════════════════════════════════════════════════
//  AI FOUNDATION MODELS — 40 AI Model Families (All AI)
// ══════════════════════════════════════════════════════════════════

export {
  AIFoundationRegistry,
  OrganismRing,
  RoutingPriority,
} from './models/AIFoundationModels.js';

export {
  AIFoundationRouter,
} from './models/AIFoundationRouter.js';

// ══════════════════════════════════════════════════════════════════
//  SHARED TYPES & CONSTANTS
// ══════════════════════════════════════════════════════════════════

export {
  PHI,
  PSI,
  SQRT5,
  GOLDEN_ANGLE,
  PI,
  TWO_PI,
  DimensionalPlane,
  LEX_OBSV_001,
  fibonacciHash,
} from './intelligence/ObserverIntelligence.js';

export type {
  SubIntelligence,
  Observation,
  CareAction,
  ObserverLex,
} from './intelligence/ObserverIntelligence.js';

export type {
  FractureIntelligence,
} from './intelligence/FractureRegistry.js';

export type {
  SovereignNode,
  SovereignCanister,
  SovereignBlock,
  ConsensusRound,
} from './intelligence/SovereignIntelligence.js';

export type {
  CommandResult,
  OrganismStatus,
  AuditEntry,
  DashboardView,
} from './intelligence/TerminalIntelligence.js';

export type {
  ClassifiedDocument,
  SynthesizedPaper,
  DocumentCategory,
} from './intelligence/ScribeIntelligence.js';

export type {
  OrganismBlueprint,
} from './intelligence/ArchitectIntelligence.js';

export type {
  SubstrateNode,
  Route,
  Footprint,
} from './intelligence/NexusIntelligence.js';

export type {
  WellnessLevel,
  CareDivision,
  CareSubstrate,
  NodeRecord,
  CareEvent,
  HabitatStatus,
  CustosLex,
} from './intelligence/CustosIntelligence.js';

export {
  LEX_CUSTOS_001,
} from './intelligence/CustosIntelligence.js';

export type {
  ThreatTier,
  DefenseDivision,
  DefenseSubstrate,
  EndpointRecord,
  DefenseEvent,
  HoneypotField,
  CrusaderUnit,
  PraesidiumLex,
} from './intelligence/PraesidiumIntelligence.js';

export {
  LEX_PRAESIDIUM_001,
} from './intelligence/PraesidiumIntelligence.js';

// ══════════════════════════════════════════════════════════════════
//  SOVEREIGN CANISTERS — Mathematical Element Intelligences
// ══════════════════════════════════════════════════════════════════

export {
  SOVEREIGN_CANISTERS,
  SovereignCanisterRegistry,
} from './intelligence/canisters/SovereignCanisters.js';

export type {
  CanisterElementId,
  ElementProperties,
  SovereignCanister as SovereignElementCanister,
  CanisterIntelligence,
  CanisterComputeResult,
} from './intelligence/canisters/SovereignCanisters.js';

// ══════════════════════════════════════════════════════════════════
//  TOKEN TECHNOLOGIES — 10 Token Techs + 5 Token AI Models + Extensions
// ══════════════════════════════════════════════════════════════════

export {
  TOKEN_TECHNOLOGIES,
  TokenTechnologyRegistry,
  TOKEN_AI_MODELS,
  TokenAIModelRegistry,
  TOKEN_EXTENSIONS,
  TOKEN_SDKS,
  TokenExtensionRegistry,
} from './sdk/tokens/index.js';

export type {
  TokenTechId,
  TokenTechnology,
  TokenAICore,
  TokenProcessResult,
  ProcessedToken,
  TokenAIModelId,
  TokenAIModel,
  TokenAICapability,
  TokenAnalysisResult,
  TokenExtensionId,
  TokenSDKId,
  TokenExtension,
  TokenSDKDefinition,
} from './sdk/tokens/index.js';

// ══════════════════════════════════════════════════════════════════
//  CHAT MINI-AIs — Embedded Intelligence Helpers
// ══════════════════════════════════════════════════════════════════

export {
  MiniAIEngine,
  createMiniAIEngine,
  MINI_AIS,
} from './desktop/NovaChatMiniAIs.js';

export type {
  MiniAIId,
  MiniAIDefinition,
  MiniAICommand,
  MiniAIResponse,
} from './desktop/NovaChatMiniAIs.js';

export type {
  ServerModel,
  ServerSubModel,
  Alert,
  AnalysisResult,
} from './models/ObserverModels.js';

export type {
  SolverResult,
  TheoryResult,
} from './models/ObserverSolverSynthesizers.js';

// ── Custos (Care House) types ────────────────────────────────────

export type {
  CareAlert,
  OverloadPrediction,
  RecoveryPattern,
  HabitatReport,
  EnvironmentOptimization,
  CapacityResult,
} from './models/CustosModels.js';

export type {
  WellnessPattern,
  CareGap,
  CareHypothesis,
  CareTheoryResult,
} from './models/CustosSolverSynthesizers.js';

export type {
  HouseCareCycleResult,
  CaredNode,
  RecoveryOrchestration,
  ManagedHabitat,
  HouseStatus as CareHouseStatus,
} from './models/CustosOrchestrator.js';

// ── Praesidium (Defense House) types ─────────────────────────────

export type {
  CombatResult,
  ShieldDeployment,
  ThreatHuntResult,
  EnvironmentScan,
  AttackTrace,
  DecoyField,
  Fortification,
  VulnerabilityAssessment,
  RepairResult,
} from './models/PraesidiumModels.js';

export type {
  ThreatPattern,
  VulnerabilityChain,
  DefenseHypothesis,
  DefenseTheoryResult,
} from './models/PraesidiumSolverSynthesizers.js';

export type {
  HouseDefenseCycleResult,
  DefendedEndpoint,
  InterceptionOrchestration,
  DeceptionOrchestration,
  FortificationOrchestration,
  HouseStatus as DefenseHouseStatus,
} from './models/PraesidiumOrchestrator.js';

// ── Crown House (Orchestrator of Orchestrators) types ────────────

export type {
  CrownCycleResult,
  CrossHouseReport,
  AdoptionOrchestration,
  OrganismHealthAssessment,
  ExperienceReport,
  CrownStatus,
} from './models/HouseOrchestrator.js';

export type {
  FractureAnalysis,
  FractureComparison,
  SovereignAlternative,
  FractureObservation,
} from './models/FractureModels.js';

export type {
  FrontendIntelligenceModel,
} from './models/FrontendIntelligenceModels.js';

export type {
  PhantomModelId,
  StealthLevel,
  EncryptionTier,
  HashAlgorithm,
  PuzzleType,
  PhantomState,
  HashDiscovery,
  BlockchainPuzzle,
  PhantomSubModel,
  CloakMetrics,
} from './models/PhantomBlockchainModels.js';

export type {
  AIFoundationModel,
  RoutingResult,
  WireState,
  Modality,
  EngineStatus,
} from './models/AIFoundationModels.js';

export type {
  RoutingRequest,
  FusionChain,
  RouterStatus,
} from './models/AIFoundationRouter.js';

// ══════════════════════════════════════════════════════════════════
//  AI EXTENSIONS — 20 Multi-AI Browser Extensions
// ══════════════════════════════════════════════════════════════════

export {
  AIExtensionRegistry,
  ExtensionClass,
} from './extensions/AIExtensionRegistry.js';

export {
  AIExtensionEngine,
} from './extensions/AIExtensionEngine.js';

export type {
  AIExtension,
  EngineBinding,
  EncryptionMode,
  ContractType,
  ExtensionActivation,
} from './extensions/AIExtensionRegistry.js';

export type {
  EncryptionState,
  ContractState,
  ExtensionEngineStatus,
  EdgeManifest,
} from './extensions/AIExtensionEngine.js';

// ══════════════════════════════════════════════════════════════════
//  AI PROTOCOLS — 10 AI-Intelligent Protocols
// ══════════════════════════════════════════════════════════════════

export {
  AIProtocolRegistry,
  ProtocolTier,
} from './protocols/AIProtocolRegistry.js';

export {
  AIProtocolEngine,
} from './protocols/AIProtocolEngine.js';

export type {
  AIProtocol,
  ProtocolEngine as AIProtocolEngineBinding,
  AdaptiveParameter,
  AdaptiveMode,
  ProtocolExecution,
  ProtocolRegistryStatus,
} from './protocols/AIProtocolRegistry.js';

export type {
  ProtocolRuntimeState,
  AdaptiveUpdate,
  ProtocolEngineStatus,
} from './protocols/AIProtocolEngine.js';

// ══════════════════════════════════════════════════════════════════
//  NOVA ENGINE SDK — 23 Sovereign Engines as AI Calls
// ══════════════════════════════════════════════════════════════════

export {
  NovaSDK,
  createNovaSDK,
} from './sdk/NovaEngineSDK.js';

export {
  NovaAPIClient,
} from './sdk/NovaAPIClient.js';

export {
  NovaEngineRegistry,
  NOVA_ENGINES,
} from './sdk/NovaEngineModels.js';

// ── NOVA-OS SDK Runner (top-level functions) ─────────────────────

export {
  boot,
  chat,
  think,
  open,
  code,
  search,
  imagine,
  translate,
  solve,
  execute,
  tokenize,
  countTokens,
  encode,
  visualizeTokens,
  explainTokens,
  engines,
  compareEngines,
  status,
  identity,
  getAGI,
  getOS,
  reboot,
  runCLI,
} from './sdk/NovaOSRunner.js';

// ── Tokenizer ────────────────────────────────────────────────────

export { NovaTokenizer, createTokenizer } from './sdk/NovaTokenizer.js';

// ── SDK Package Manifest ─────────────────────────────────────────

export { NOVA_SDK_MANIFEST, printSDKSummary } from './sdk/NovaSDKPackage.js';

export type {
  NovaOSSDKOptions,
} from './sdk/NovaOSRunner.js';

export type {
  NovaSDKManifest,
  SDKExport,
  PublicRepoIdea,
} from './sdk/NovaSDKPackage.js';

export type {
  NovaToken,
  NovaTokenizerResult,
  NovaTokenizerConfig,
} from './sdk/NovaTokenizer.js';

export type {
  NovaAPIConfig,
  NovaWireRequest,
  NovaWireResponse,
  NovaCognosAPI,
  NovaProfundisAPI,
  NovaFusioAPI,
  NovaLinguaAPI,
  NovaStratosAPI,
  NovaMemoriaAPI,
  NovaVectorAPI,
  NovaCodexAPI,
  NovaPictorAPI,
  NovaKinemaAPI,
  NovaHarmoniaAPI,
  NovaSegmentumAPI,
  NovaScrutatorAPI,
  NovaCustodisAPI,
  NovaRankerAPI,
  NovaFormalisAPI,
  NovaAlgorithmusAPI,
  NovaVoxAPI,
  NovaSocialisAPI,
  NovaEmpathosAPI,
  NovaAnalyticaAPI,
  NovaStructuraAPI,
  NovaVisioAPI,
} from './sdk/NovaAPIClient.js';

export type {
  NovaModality,
  NovaEngineId,
  NovaWireSlug,
  NovaEngineDefinition,
  NovaMessage,
  NovaFunctionDef,
  NovaChatRequest,
  NovaChatResponse,
  NovaChatStreamChunk,
  NovaEmbeddingRequest,
  NovaEmbeddingResponse,
  NovaImageRequest,
  NovaImageResponse,
  NovaVideoRequest,
  NovaVideoResponse,
  NovaAudioRequest,
  NovaAudioResponse,
  NovaCodeRequest,
  NovaCodeResponse,
  NovaSearchRequest,
  NovaSearchResponse,
  NovaSafetyRequest,
  NovaSafetyResponse,
  NovaRankRequest,
  NovaRankResponse,
} from './sdk/NovaEngineModels.js';

// ══════════════════════════════════════════════════════════════════
//  BROWSER EXTENSIONS — Cross-Browser Runtime + Manifest Generator
// ══════════════════════════════════════════════════════════════════

export {
  detectBrowser,
  createMessage,
  sendMessage,
  onMessage,
  sendToTab,
  loadConfig,
  saveConfig,
  setBadge,
  setExtensionIcon,
  openSidePanel,
  setSidePanelOptions,
} from './browser/NovaExtensionRuntime.js';

export { NovaManifestGenerator } from './browser/NovaExtensionManifestGenerator.js';
export { NovaContentScript } from './browser/NovaContentScript.js';
export { NovaBackgroundWorker } from './browser/NovaBackgroundWorker.js';
export { NovaPopupController } from './browser/NovaPopupController.js';

export type {
  BrowserType,
  NovaMessageType,
  NovaExtensionMessage,
  NovaStorageConfig,
} from './browser/NovaExtensionRuntime.js';

export type {
  ManifestV3,
} from './browser/NovaExtensionManifestGenerator.js';

export type {
  NovaSidebarConfig,
} from './browser/NovaContentScript.js';

export type {
  PopupTab,
  PopupState,
} from './browser/NovaPopupController.js';

// ══════════════════════════════════════════════════════════════════
//  NOVA-OS — Sovereign Desktop AGI Operating System
// ══════════════════════════════════════════════════════════════════

export {
  NovaOS,
  NOVA_OS_IDENTITY,
  createNovaOS,
} from './desktop/NovaOS.js';

export {
  NovaDesktopAGI,
  createDesktopAGI,
} from './desktop/NovaDesktopAGI.js';

export { NovaChatTerminal } from './desktop/NovaChatTerminal.js';
export { NovaAppController } from './desktop/NovaAppController.js';
export { NovaEngineComparison, EXTERNAL_MODELS } from './desktop/NovaEngineComparison.js';

export type {
  NovaOSState,
  NovaOSService,
} from './desktop/NovaOS.js';

export type {
  AGIIntent,
  AGIIntentResult,
  AGIResponse,
} from './desktop/NovaDesktopAGI.js';

export type {
  TerminalCommandType,
  ParsedCommand,
  TerminalMessage,
  TerminalSession,
  TerminalConfig,
} from './desktop/NovaChatTerminal.js';

export type {
  AppPlatform,
  AppLaunchRequest,
  AppLaunchResult,
  RunningProcess,
  ShellCommand,
  ShellResult,
  FileAction,
  FileActionResult,
  SystemAction,
  SystemActionResult,
  AppAuditEntry,
} from './desktop/NovaAppController.js';

export type {
  ExternalModelProfile,
  EngineComparison,
  EngineComparisonMatrix,
  FullComparisonReport,
  ComparisonSummary,
} from './desktop/NovaEngineComparison.js';

// ══════════════════════════════════════════════════════════════════
//  MARKETPLACE — AI Workforce + Generative Frontend + Spatial Canvas
// ══════════════════════════════════════════════════════════════════

export {
  GenerativeUIEngine,
  createGenerativeUIEngine,
  SpatialCanvasSDK,
  createSpatialCanvasSDK,
  LANGUAGE_AIS,
  MULTI_GROUP_MODELS,
  LANGUAGE_AI_GROUP_INDEX,
  LanguageAIRegistry,
  AIWorkforceOrchestrator,
  createAIWorkforceOrchestrator,
  NATIVE_NOVA_AIS,
  NOVA_AI_GROUPS,
  NativeNovaAIRegistry,
} from './marketplace/index.js';

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
  EngineKind,
  LanguageEngine,
  LanguageAIGroup,
  AIBuildRole,
  AITier,
  AIWorkerStatus,
  LanguageAI,
  MultiGroupAIModel,
  LanguageAIResult,
  BuildIntent,
  AITask,
  PipelineStage,
  BuildPipeline,
  AIMemoryEntry,
  WorkforceStats,
  NovaEngineKind,
  NovaIntelligenceTier,
  NovaOperationalMode,
  NovaAIStatus,
  NovaEngine,
  NativeNovaAI,
  NovaAIGroup,
  NovaAIResult,
} from './marketplace/index.js';