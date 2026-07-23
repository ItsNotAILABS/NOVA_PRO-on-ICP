// ═══════════════════════════════════════════════════════════════════════════════
// RESEARCH MINT API — User-Facing SDK for Research Packet Tokenization
// ═══════════════════════════════════════════════════════════════════════════════
// Complete API client for interacting with the Research Mint canister.
// Provides wire-protocol-attested communication, client-side validation,
// and event-driven state management.
//
// Casa de Medina — Architectos de Architectura Inteligente
// ═══════════════════════════════════════════════════════════════════════════════

import {
  ResearchMintIntelligence,
  researchMintIntelligence,
  fibonacciHash,
  chainHash,
  calculateFidelity,
  estimateTokenValue,
  type ResearchPacket,
  type ResearchToken,
  type ResearchDomain,
  type IPLevel,
  type TokenRole,
  type MintRequest,
  type MintResult,
  type ChainStatus,
  type LedgerEntry,
  type ProtocolEconomics,
  type ResearchMintEvent,
} from '../intelligence/ResearchMintIntelligence.js';

// ─── Wire Protocol Types ──────────────────────────────────────────────────────

const FIBONACCI = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181, 6765];

export interface ResearchMintAPIConfig {
  /** Canister ID or HTTP endpoint for the research_mint organism */
  endpoint: string;
  /** API key for authenticated access (optional for public queries) */
  apiKey?: string;
  /** Timeout in ms (default: F(15)=610 × 100 = 61000ms) */
  timeout?: number;
  /** Enable sovereign mode (edge-only, no cloud relay) */
  sovereignMode?: boolean;
  /** Event callbacks */
  onMint?: (result: MintResult) => void;
  onTransfer?: (txId: number) => void;
  onError?: (error: ResearchMintError) => void;
  onHeartbeat?: (beat: number) => void;
}

export interface ResearchMintError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface WireAttestation {
  hash: number;
  chainPosition: number;
  previousHash: number;
  timestamp: number;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: ResearchMintError;
  attestation: WireAttestation;
  latencyMs: number;
}

// ─── Research Mint API Client ─────────────────────────────────────────────────

export class ResearchMintAPI {
  private config: Required<ResearchMintAPIConfig>;
  private intelligence: ResearchMintIntelligence;
  private requestCount = 0;
  private lastAttestation: WireAttestation = { hash: 0, chainPosition: 0, previousHash: 0, timestamp: 0 };

  constructor(config: ResearchMintAPIConfig) {
    this.config = {
      endpoint: config.endpoint,
      apiKey: config.apiKey ?? '',
      timeout: config.timeout ?? 61_000,
      sovereignMode: config.sovereignMode ?? false,
      onMint: config.onMint ?? (() => {}),
      onTransfer: config.onTransfer ?? (() => {}),
      onError: config.onError ?? (() => {}),
      onHeartbeat: config.onHeartbeat ?? (() => {}),
    };
    this.intelligence = researchMintIntelligence;

    // Wire heartbeat events to callback
    this.intelligence.on('heartbeat', (event) => {
      this.config.onHeartbeat(event.data.beat as number);
    });
  }

  // ─── Wire Protocol ──────────────────────────────────────────────────────

  private createAttestation(payloadHash: number): WireAttestation {
    const position = this.requestCount++;
    const hash = chainHash(payloadHash, this.lastAttestation.hash, position);
    const attestation: WireAttestation = {
      hash,
      chainPosition: position,
      previousHash: this.lastAttestation.hash,
      timestamp: Date.now(),
    };
    this.lastAttestation = attestation;
    return attestation;
  }

  private async wireRequest<T>(method: string, params: Record<string, unknown>): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const payloadHash = fibonacciHash(JSON.stringify(params));
    const attestation = this.createAttestation(payloadHash);

    try {
      const response = await fetch(`${this.config.endpoint}/api/research-mint/${method}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Nova-Wire-Version': '1.0',
          'X-Nova-Attestation': String(attestation.hash),
          'X-Nova-Chain-Position': String(attestation.chainPosition),
          ...(this.config.apiKey ? { 'Authorization': 'Bearer ' + this.config.apiKey } : {}),
        },
        body: JSON.stringify({
          method,
          params,
          attestation,
          timestamp: Date.now(),
        }),
        signal: AbortSignal.timeout(this.config.timeout),
      });

      const data = await response.json() as T;
      const latencyMs = Date.now() - startTime;

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : { code: String(response.status), message: 'Request failed', details: data as Record<string, unknown> },
        attestation,
        latencyMs,
      };
    } catch (err) {
      const error: ResearchMintError = {
        code: 'NETWORK_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      };
      this.config.onError(error);
      return {
        success: false,
        error,
        attestation,
        latencyMs: Date.now() - startTime,
      };
    }
  }

  // ─── Mint Operations ────────────────────────────────────────────────────

  /**
   * Mint a new research packet — creates, encrypts, chains, and tokenizes in one call.
   * Performs client-side validation and pre-computation before submitting.
   */
  async mintResearchPacket(request: MintRequest): Promise<APIResponse<MintResult>> {
    // Client-side validation
    const validation = this.intelligence.validatePacket(request);
    if (!validation.valid) {
      const error: ResearchMintError = {
        code: 'VALIDATION_ERROR',
        message: validation.errors.join('; '),
        details: { errors: validation.errors },
      };
      this.config.onError(error);
      return {
        success: false,
        error,
        attestation: this.lastAttestation,
        latencyMs: 0,
      };
    }

    // Pre-compute for UX feedback
    const preview = this.intelligence.prepareMint(request);

    // Submit to canister
    const response = await this.wireRequest<MintResult>('mintResearchPacket', {
      title: request.title,
      abstractText: request.abstractText,
      content: request.content,
      domain: request.domain,
      ipLevel: request.ipLevel,
      role: request.role,
    });

    if (response.success && response.data) {
      this.config.onMint(response.data);

      // Emit bus event
      this.intelligence.on('mint', () => {});
    }

    return response;
  }

  /**
   * Transfer a research token to another principal.
   */
  async transferToken(tokenId: number, to: string, memo: string): Promise<APIResponse<{ txId: number }>> {
    const response = await this.wireRequest<{ txId: number }>('transferToken', { tokenId, to, memo });

    if (response.success && response.data) {
      this.config.onTransfer(response.data.txId);
    }

    return response;
  }

  /**
   * Burn a research token (owner-initiated revocation).
   */
  async burnToken(tokenId: number): Promise<APIResponse<{ txId: number }>> {
    return this.wireRequest<{ txId: number }>('burnToken', { tokenId });
  }

  /**
   * Add a citation from one packet to another.
   */
  async addCitation(fromPacketId: number, toPacketId: number): Promise<APIResponse<{ txId: number }>> {
    return this.wireRequest<{ txId: number }>('addCitation', { fromPacketId, toPacketId });
  }

  /**
   * Publish a minted packet (makes it available publicly, respecting IP level).
   */
  async publishPacket(packetId: number): Promise<APIResponse<void>> {
    return this.wireRequest<void>('publishPacket', { packetId });
  }

  // ─── Query Operations ───────────────────────────────────────────────────

  /**
   * Get a research packet by ID.
   */
  async getPacket(packetId: number): Promise<APIResponse<ResearchPacket>> {
    const cached = this.intelligence.getCachedPacket(packetId);
    if (cached) {
      return {
        success: true,
        data: cached,
        attestation: this.lastAttestation,
        latencyMs: 0,
      };
    }

    const response = await this.wireRequest<ResearchPacket>('getPacket', { packetId });
    if (response.success && response.data) {
      this.intelligence.cachePacket(response.data);
    }
    return response;
  }

  /**
   * Get a research token by ID.
   */
  async getToken(tokenId: number): Promise<APIResponse<ResearchToken>> {
    const cached = this.intelligence.getCachedToken(tokenId);
    if (cached) {
      return {
        success: true,
        data: cached,
        attestation: this.lastAttestation,
        latencyMs: 0,
      };
    }

    const response = await this.wireRequest<ResearchToken>('getToken', { tokenId });
    if (response.success && response.data) {
      this.intelligence.cacheToken(response.data);
    }
    return response;
  }

  /**
   * Get all tokens owned by a principal.
   */
  async getTokensByOwner(owner: string): Promise<APIResponse<ResearchToken[]>> {
    return this.wireRequest<ResearchToken[]>('getTokensByOwner', { owner });
  }

  /**
   * Get chain integrity status.
   */
  async getChainStatus(): Promise<APIResponse<ChainStatus>> {
    const response = await this.wireRequest<ChainStatus>('getChainStatus', {});
    if (response.success && response.data) {
      this.intelligence.updateChainStatus(response.data);
    }
    return response;
  }

  /**
   * Get protocol economics.
   */
  async getEconomics(): Promise<APIResponse<ProtocolEconomics>> {
    const response = await this.wireRequest<ProtocolEconomics>('getEconomics', {});
    if (response.success && response.data) {
      this.intelligence.updateEconomics(response.data);
    }
    return response;
  }

  /**
   * Get ledger history (paginated).
   */
  async getLedgerHistory(offset: number, limit: number): Promise<APIResponse<LedgerEntry[]>> {
    return this.wireRequest<LedgerEntry[]>('getLedgerHistory', { offset, limit });
  }

  /**
   * Get packets by research domain.
   */
  async getPacketsByDomain(domain: ResearchDomain, offset: number, limit: number): Promise<APIResponse<ResearchPacket[]>> {
    return this.wireRequest<ResearchPacket[]>('getPacketsByDomain', { domain, offset, limit });
  }

  // ─── Client-Side Utilities ──────────────────────────────────────────────

  /**
   * Pre-compute mint preview without submitting.
   */
  previewMint(request: MintRequest): {
    contentHash: number;
    estimatedFidelity: number;
    estimatedValue: number;
    validation: { valid: boolean; errors: string[] };
  } {
    const preview = this.intelligence.prepareMint(request);
    const validation = this.intelligence.validatePacket(request);
    return {
      contentHash: preview.contentHash,
      estimatedFidelity: preview.estimatedFidelity,
      estimatedValue: preview.estimatedValue,
      validation,
    };
  }

  /**
   * Verify a chain hash locally.
   */
  verifyChainHash(contentHash: number, previousHash: number, position: number, expectedHash: number): boolean {
    return chainHash(contentHash, previousHash, position) === expectedHash;
  }

  /**
   * Get the intelligence module for direct access.
   */
  getIntelligence(): ResearchMintIntelligence {
    return this.intelligence;
  }

  /**
   * Subscribe to research mint events.
   */
  on(eventType: string, handler: (event: ResearchMintEvent) => void): void {
    this.intelligence.on(eventType, handler);
  }

  /**
   * Unsubscribe from events.
   */
  off(eventType: string, handler: (event: ResearchMintEvent) => void): void {
    this.intelligence.off(eventType, handler);
  }

  /**
   * Get full system status.
   */
  getStatus(): {
    connected: boolean;
    endpoint: string;
    requestCount: number;
    lastAttestation: WireAttestation;
    intelligence: ReturnType<ResearchMintIntelligence['status']>;
  } {
    return {
      connected: true,
      endpoint: this.config.endpoint,
      requestCount: this.requestCount,
      lastAttestation: this.lastAttestation,
      intelligence: this.intelligence.status(),
    };
  }

  /**
   * Shutdown the API client and intelligence heartbeat.
   */
  destroy(): void {
    this.intelligence.stopHeartbeat();
  }
}

// ─── Factory Function ─────────────────────────────────────────────────────────

/** Create a ResearchMintAPI client instance. */
export function createResearchMintAPI(config: ResearchMintAPIConfig): ResearchMintAPI {
  return new ResearchMintAPI(config);
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
  fibonacciHash,
  chainHash,
  calculateFidelity,
  estimateTokenValue,
  ResearchMintIntelligence,
  researchMintIntelligence,
};

export type {
  ResearchPacket,
  ResearchToken,
  ResearchDomain,
  IPLevel,
  TokenRole,
  MintRequest,
  MintResult,
  ChainStatus,
  LedgerEntry,
  ProtocolEconomics,
  ResearchMintEvent,
};
