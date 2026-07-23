// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH MINT INTELLIGENCE — Frontend AGI for Research Packet System
// ═══════════════════════════════════════════════════════════════════════════════
// TypeScript intelligence layer for the Research Mint organism.
// Handles client-side encryption prep, API orchestration, bus events,
// and user-facing interfaces for the research packet tokenization system.
//
// Casa de Medina — Architectos de Architectura Inteligente
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Constants ────────────────────────────────────────────────────────────────

const PHI = 1.6180339887498948482;
const PHI_INV = 0.6180339887498948482;
const PHI_SQ = 2.6180339887498948482;
const GOLDEN_ANGLE_RAD = 2.39996322972865332;
const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];
const HEARTBEAT_MS = 873; // φ⁴ × Schumann period

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResearchDomain =
  | 'Mathematics'
  | 'Physics'
  | 'ComputerScience'
  | 'Biology'
  | 'Economics'
  | 'Philosophy'
  | 'Engineering'
  | 'Interdisciplinary'
  | 'Protocol'
  | 'Sovereign';

export type IPLevel = 'Public' | 'Protected' | 'Sovereign' | 'HighCouncil';

export type PacketStatus = 'Draft' | 'Encrypted' | 'Minted' | 'Published' | 'Archived' | 'Revoked';

export type TokenRole = 'Research' | 'Discovery' | 'Foundation' | 'Citation' | 'Review';

export type LedgerKind = 'Mint' | 'Transfer' | 'Burn' | 'Lock' | 'Unlock' | 'CitationReward';

export interface ResearchPacket {
  id: number;
  title: string;
  abstractText: string;
  contentHash: number;
  encryptedPayload: Uint8Array;
  domain: ResearchDomain;
  ipLevel: IPLevel;
  status: PacketStatus;
  author: string; // Principal as text
  createdAt: bigint;
  mintedAt: bigint | null;
  chainPosition: number;
  previousHash: number;
  proofOfCreation: number;
  encryptionKeyHash: number;
  fidelityScore: number;
  citationCount: number;
  tokenId: number | null;
}

export interface ResearchToken {
  id: number;
  packetId: number;
  owner: string;
  mintedAt: bigint;
  value: number;
  role: TokenRole;
  chainHash: number;
  transferable: boolean;
  metadata: TokenMetadata;
}

export interface TokenMetadata {
  title: string;
  domain: ResearchDomain;
  ipLevel: IPLevel;
  abstractHash: number;
  authorPrincipal: string;
  fidelityAtMint: number;
}

export interface ChainStatus {
  length: number;
  lastHash: number;
  totalPackets: number;
  totalTokens: number;
  totalValueMinted: number;
  totalBurned: number;
  integrity: boolean;
}

export interface LedgerEntry {
  id: number;
  kind: LedgerKind;
  tokenId: number;
  from: string | null;
  to: string;
  amount: number;
  timestamp: bigint;
  memo: string;
}

export interface MintRequest {
  title: string;
  abstractText: string;
  content: string;
  domain: ResearchDomain;
  ipLevel: IPLevel;
  role: TokenRole;
}

export interface MintResult {
  tokenId: number;
  packetId: number;
  chainPosition: number;
  txId: number;
}

export interface ProtocolEconomics {
  totalSupply: number;
  circulatingValue: number;
  burnedValue: number;
  packetCount: number;
  tokenCount: number;
  chainLength: number;
  avgFidelity: number;
  mintFee: number;
}

export interface ResearchMintEvent {
  type: 'mint' | 'transfer' | 'burn' | 'citation' | 'publish' | 'heartbeat' | 'integrity_check';
  timestamp: number;
  data: Record<string, unknown>;
}

// ─── Fibonacci Cryptography (Client-Side) ─────────────────────────────────────

/**
 * Fibonacci hash — deterministic content-addressed hash matching the canister implementation.
 * Used for client-side content verification and pre-computation.
 */
export function fibonacciHash(input: string): number {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  let hash = 0;
  let fibIdx = 0;

  for (let i = 0; i < bytes.length; i++) {
    const fibWeight = FIBONACCI[fibIdx % FIBONACCI.length];
    hash = (hash + (bytes[i] * fibWeight)) >>> 0;
    hash = (hash * 1597 + 997) >>> 0;
    fibIdx++;
  }

  // Golden angle rotation
  hash = (hash * 2584 + 4181) >>> 0;
  return hash;
}

/**
 * Chain hash — client-side verification of chain position.
 */
export function chainHash(contentHash: number, prevHash: number, position: number): number {
  let h = contentHash;
  const CHAIN_DEPTH = 13;
  for (let round = 0; round < CHAIN_DEPTH; round++) {
    const fibMix = FIBONACCI[(round + position) % FIBONACCI.length];
    h = (h * fibMix + prevHash) >>> 0;
    h = (h * 987 + 610) >>> 0;
  }
  return h;
}

/**
 * Calculate fidelity score (client-side prediction before mint).
 */
export function calculateFidelity(abstractLen: number, domain: ResearchDomain, ipLevel: IPLevel): number {
  const lenScore = (abstractLen > 100 && abstractLen < 2000)
    ? (PHI_INV * abstractLen) / 400.0
    : 0.5;

  const domainMult: Record<ResearchDomain, number> = {
    Mathematics: PHI,
    Physics: PHI,
    ComputerScience: PHI_INV * PHI,
    Biology: 1.0,
    Economics: 1.0,
    Philosophy: 1.0,
    Engineering: 1.0,
    Interdisciplinary: 1.0,
    Protocol: PHI_SQ,
    Sovereign: PHI_SQ,
  };

  const ipMult: Record<IPLevel, number> = {
    Public: 1.0,
    Protected: PHI_INV,
    Sovereign: PHI,
    HighCouncil: PHI_SQ,
  };

  const raw = lenScore * domainMult[domain] * ipMult[ipLevel];
  return Math.min(Math.max(raw, 0), PHI_SQ);
}

/**
 * Calculate estimated token value from fidelity.
 */
export function estimateTokenValue(fidelity: number): number {
  return Math.floor((1_000_000 * fidelity) / PHI);
}

/**
 * Generate proof-of-creation hash (client-side attestation).
 */
export function proofOfCreation(contentHash: number, authorPrincipal: string, timestamp: number): number {
  const authorHash = fibonacciHash(authorPrincipal);
  const timeComponent = Math.abs(timestamp) % 6765;
  let proof = (contentHash * authorHash) >>> 0;
  proof = (proof + timeComponent) >>> 0;

  const ENCRYPTION_ROUNDS = 8;
  for (let round = 0; round < ENCRYPTION_ROUNDS; round++) {
    proof = (proof * FIBONACCI[round + 5] + FIBONACCI[round + 8]) >>> 0;
  }
  return proof;
}

// ─── Event Bus ────────────────────────────────────────────────────────────────

type EventHandler = (event: ResearchMintEvent) => void;

class ResearchMintBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private history: ResearchMintEvent[] = [];
  private maxHistory = 144; // F(12)

  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  off(eventType: string, handler: EventHandler): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  emit(event: ResearchMintEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Emit to specific type listeners
    this.handlers.get(event.type)?.forEach(h => h(event));
    // Emit to wildcard listeners
    this.handlers.get('*')?.forEach(h => h(event));
  }

  getHistory(): ResearchMintEvent[] {
    return [...this.history];
  }
}

// ─── Research Mint Intelligence Class ─────────────────────────────────────────

export class ResearchMintIntelligence {
  private bus: ResearchMintBus;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatCount = 0;
  private localPacketCache: Map<number, ResearchPacket> = new Map();
  private localTokenCache: Map<number, ResearchToken> = new Map();
  private chainStatus: ChainStatus | null = null;
  private economics: ProtocolEconomics | null = null;

  constructor() {
    this.bus = new ResearchMintBus();
    this.startHeartbeat();
  }

  // ─── Heartbeat ──────────────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.heartbeatCount++;
      this.bus.emit({
        type: 'heartbeat',
        timestamp: Date.now(),
        data: { beat: this.heartbeatCount, phi_phase: (this.heartbeatCount * GOLDEN_ANGLE_RAD) % (2 * Math.PI) }
      });

      // Every F(7)=13 beats: emit integrity check
      if (this.heartbeatCount % 13 === 0) {
        this.bus.emit({
          type: 'integrity_check',
          timestamp: Date.now(),
          data: { beat: this.heartbeatCount, chainIntegrity: this.chainStatus?.integrity ?? true }
        });
      }
    }, HEARTBEAT_MS);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // ─── Event Bus Access ───────────────────────────────────────────────────

  on(eventType: string, handler: EventHandler): void {
    this.bus.on(eventType, handler);
  }

  off(eventType: string, handler: EventHandler): void {
    this.bus.off(eventType, handler);
  }

  getEventHistory(): ResearchMintEvent[] {
    return this.bus.getHistory();
  }

  // ─── Pre-Mint Operations (Client-Side) ──────────────────────────────────

  /**
   * Prepare a research packet for minting — performs all client-side
   * computations (hashing, fidelity estimation, chain position prediction)
   * before submitting to the canister.
   */
  prepareMint(request: MintRequest): {
    contentHash: number;
    abstractHash: number;
    estimatedFidelity: number;
    estimatedValue: number;
    proofPreview: number;
  } {
    const contentHash = fibonacciHash(request.content);
    const abstractHash = fibonacciHash(request.abstractText);
    const estimatedFidelity = calculateFidelity(
      request.abstractText.length,
      request.domain,
      request.ipLevel
    );
    const estimatedValue = estimateTokenValue(estimatedFidelity);
    const proofPreview = proofOfCreation(contentHash, 'preview', Date.now());

    return {
      contentHash,
      abstractHash,
      estimatedFidelity,
      estimatedValue,
      proofPreview,
    };
  }

  /**
   * Validate a research packet before submission.
   */
  validatePacket(request: MintRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.title || request.title.trim().length === 0) {
      errors.push('Title is required');
    }
    if (request.title.length > 256) {
      errors.push('Title must be under 256 characters');
    }
    if (!request.abstractText || request.abstractText.trim().length < 50) {
      errors.push('Abstract must be at least 50 characters');
    }
    if (!request.content || request.content.trim().length < 100) {
      errors.push('Content must be at least 100 characters');
    }
    if (request.content.length > 1_000_000) {
      errors.push('Content exceeds 1MB limit');
    }

    return { valid: errors.length === 0, errors };
  }

  // ─── Cache Management ───────────────────────────────────────────────────

  cachePacket(packet: ResearchPacket): void {
    this.localPacketCache.set(packet.id, packet);
  }

  cacheToken(token: ResearchToken): void {
    this.localTokenCache.set(token.id, token);
  }

  getCachedPacket(id: number): ResearchPacket | undefined {
    return this.localPacketCache.get(id);
  }

  getCachedToken(id: number): ResearchToken | undefined {
    return this.localTokenCache.get(id);
  }

  updateChainStatus(status: ChainStatus): void {
    this.chainStatus = status;
  }

  updateEconomics(economics: ProtocolEconomics): void {
    this.economics = economics;
  }

  getChainStatus(): ChainStatus | null {
    return this.chainStatus;
  }

  getEconomics(): ProtocolEconomics | null {
    return this.economics;
  }

  // ─── Analytics ──────────────────────────────────────────────────────────

  /**
   * Calculate φ-weighted research impact score for a packet.
   */
  calculateImpact(packet: ResearchPacket): number {
    const citationWeight = packet.citationCount * PHI;
    const fidelityWeight = packet.fidelityScore * PHI_SQ;
    const ageDecay = PHI_INV; // Simplified — real impl uses timestamp delta
    return (citationWeight + fidelityWeight) * ageDecay;
  }

  /**
   * Get domain distribution of cached packets.
   */
  getDomainDistribution(): Record<ResearchDomain, number> {
    const dist: Record<ResearchDomain, number> = {
      Mathematics: 0,
      Physics: 0,
      ComputerScience: 0,
      Biology: 0,
      Economics: 0,
      Philosophy: 0,
      Engineering: 0,
      Interdisciplinary: 0,
      Protocol: 0,
      Sovereign: 0,
    };

    for (const [, packet] of this.localPacketCache) {
      dist[packet.domain]++;
    }
    return dist;
  }

  // ─── AnimaMicro Protocol ────────────────────────────────────────────────

  pulse(tick: number): { alive: boolean; phase: number; coherence: number } {
    const phase = (tick * GOLDEN_ANGLE_RAD) % (2 * Math.PI);
    const coherence = Math.abs(Math.cos(phase)) * PHI_INV;
    return { alive: true, phase, coherence };
  }

  think(input: string): { hash: number; classification: ResearchDomain; confidence: number } {
    const hash = fibonacciHash(input);
    // Simple keyword-based domain classification
    const domainKeywords: Record<ResearchDomain, string[]> = {
      Mathematics: ['theorem', 'proof', 'equation', 'formula', 'fibonacci', 'phi', 'golden'],
      Physics: ['quantum', 'particle', 'energy', 'wave', 'field', 'relativity'],
      ComputerScience: ['algorithm', 'protocol', 'canister', 'blockchain', 'compute', 'code'],
      Biology: ['organism', 'cell', 'gene', 'evolution', 'neural', 'brain'],
      Economics: ['token', 'market', 'supply', 'demand', 'trade', 'value'],
      Philosophy: ['consciousness', 'existence', 'mind', 'thought', 'reality'],
      Engineering: ['system', 'build', 'architecture', 'design', 'engine'],
      Interdisciplinary: ['cross', 'multi', 'unified', 'integrated'],
      Protocol: ['protocol', 'standard', 'specification', 'interface', 'api'],
      Sovereign: ['sovereign', 'autonomous', 'self', 'independent', 'native'],
    };

    const lower = input.toLowerCase();
    let bestDomain: ResearchDomain = 'Interdisciplinary';
    let bestScore = 0;

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const score = keywords.filter(k => lower.includes(k)).length;
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain as ResearchDomain;
      }
    }

    const confidence = bestScore > 0 ? Math.min(bestScore / 3, 1.0) * PHI_INV + 0.382 : 0.382;

    return { hash, classification: bestDomain, confidence };
  }

  reflect(depth: number): { insight: string; phi_depth: number } {
    const phiDepth = Math.pow(PHI, -depth);
    const insights = [
      'Research packets form an immutable chain of intellectual sovereignty.',
      'Each token is a crystallized thought, encrypted at the moment of creation.',
      'The Fibonacci hash chain ensures no knowledge can be retroactively altered.',
      'φ-decay naturally archives old research while preserving its chain position.',
      'Citation tokens create an economy of acknowledged intellectual contribution.',
    ];
    return { insight: insights[depth % insights.length], phi_depth: phiDepth };
  }

  status(): { name: string; heartbeat: number; packets: number; tokens: number; chainIntegrity: boolean } {
    return {
      name: 'ResearchMint',
      heartbeat: this.heartbeatCount,
      packets: this.localPacketCache.size,
      tokens: this.localTokenCache.size,
      chainIntegrity: this.chainStatus?.integrity ?? true,
    };
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const researchMintIntelligence = new ResearchMintIntelligence();
export default ResearchMintIntelligence;
