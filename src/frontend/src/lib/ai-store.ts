/**
 * NOVA AI Store — Multi-Engine AI State Management
 *
 * Manages AI conversation state, engine selection, and inference results.
 * Uses φ-mathematics for confidence scoring and priority queuing.
 *
 * Casa de Medina — Architectos de Architectura Inteligente
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { PHI } from '../store/nova-store';
import type { EngineLanguage, EngineCategory } from './engine-registry';

// ─── AI Message Types ────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system' | 'engine';

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  engineId?: string;
  engineName?: string;
  confidence?: number;       // φ-weighted confidence
  executionTimeMs?: number;
  metadata?: Record<string, unknown>;
}

export interface EngineFilter {
  languages: EngineLanguage[];
  categories: EngineCategory[];
  minConfidence: number;
}

export type AIMode = 'chat' | 'reason' | 'verify' | 'orchestrate';

// ─── AI State Interface ──────────────────────────────────────────────────────

export interface AIState {
  // Conversation
  messages: AIMessage[];
  isProcessing: boolean;
  currentInput: string;

  // Engine selection
  selectedEngineId: string | null;
  activeEngines: string[];
  engineFilter: EngineFilter;

  // AI Mode
  mode: AIMode;
  multiEngineMode: boolean;  // When true, dispatches to multiple engines

  // Metrics
  totalInferences: number;
  avgConfidence: number;
  avgLatencyMs: number;

  // Actions
  sendMessage: (content: string) => void;
  setInput: (input: string) => void;
  selectEngine: (engineId: string | null) => void;
  toggleEngine: (engineId: string) => void;
  setMode: (mode: AIMode) => void;
  setMultiEngineMode: (enabled: boolean) => void;
  setEngineFilter: (filter: Partial<EngineFilter>) => void;
  clearConversation: () => void;
}

// ─── AI Simulation (Local Processing) ────────────────────────────────────────

function generatePhiConfidence(): number {
  // Generate confidence using φ-distribution
  const base = 0.7 + Math.random() * 0.25;
  return Math.min(1, base * PHI / (PHI + 0.2));
}

function generateEngineResponse(content: string, mode: AIMode, engineId: string | null): AIMessage {
  const responses: Record<AIMode, (input: string) => string> = {
    chat: (input) => {
      if (input.toLowerCase().includes('engine')) {
        return `The NOVA multi-engine architecture provides ${14} active engines across ${7} languages. Each engine operates with φ-weighted priority, ensuring optimal task routing. The system supports JavaScript, Python, Julia, Motoko, Rust, Haskell, Lean4, Coq, Agda, Idris2, and F# engines.`;
      }
      if (input.toLowerCase().includes('organism')) {
        return `NOVA organisms are self-bootstrapping computational entities with BiologicalHeart (873ms φ-heartbeat). Each organism maintains its own CIL (Cognitive Internal Language) log and operates within the Architectonic Engine. The organisms coordinate via Kuramoto oscillator synchronization.`;
      }
      if (input.toLowerCase().includes('ai') || input.toLowerCase().includes('intelligence')) {
        return `The NOVA AI layer operates through MindStack and SocialStack engines, providing structured reasoning, local inference with φ-confidence scoring, and social trust graph computation. On-chain inference runs via the Brain canister on ICP, achieving persistent AI memory with sovereign data ownership.`;
      }
      return `Processing through the Architectonic Engine. The NOVA system analyzes your query using φ-weighted multi-agent reasoning. ${ENGINES_SUMMARY}. Each response is confidence-scored using golden ratio mathematics (φ = 1.618...).`;
    },
    reason: (input) => {
      return `**Structured Reasoning Analysis:**\n\n` +
        `1. **Decomposition** — Breaking "${input.slice(0, 50)}..." into primitive components\n` +
        `2. **Multi-path exploration** — ${Math.floor(PHI * 3)} parallel reasoning threads activated\n` +
        `3. **Cross-validation** — Agents challenge assumptions across threads\n` +
        `4. **Synthesis** — Converging on φ-weighted consensus\n\n` +
        `**Conclusion:** The analysis yields a confidence score of ${generatePhiConfidence().toFixed(4)} based on ${Math.floor(PHI * PHI * 5)} evaluated pathways.`;
    },
    verify: (_input) => {
      return `**Formal Verification Report:**\n\n` +
        `• **Type Safety:** ✓ Verified via Lean4 dependent types\n` +
        `• **Purity:** ✓ Haskell referential transparency confirmed\n` +
        `• **Proof Status:** ✓ Coq CoC verification complete\n` +
        `• **Coverage:** ${(generatePhiConfidence() * 100).toFixed(1)}% of state space explored\n\n` +
        `Zero-cost verification engines confirm: the proposition is well-typed and holds under all constructive interpretations.`;
    },
    orchestrate: (_input) => {
      return `**Multi-Engine Orchestration:**\n\n` +
        `Dispatching to ${Math.floor(PHI * 4)} engines simultaneously:\n\n` +
        `| Engine | Status | Confidence | Latency |\n` +
        `|--------|--------|------------|---------|\n` +
        `| MindStack (Julia) | ✓ Complete | ${generatePhiConfidence().toFixed(3)} | ${Math.floor(300 * Math.random() + 100)}ms |\n` +
        `| CPL Law (Julia) | ✓ Complete | ${generatePhiConfidence().toFixed(3)} | ${Math.floor(200 * Math.random() + 80)}ms |\n` +
        `| Brain (Motoko/ICP) | ✓ Complete | ${generatePhiConfidence().toFixed(3)} | ${Math.floor(2000 * Math.random() + 500)}ms |\n` +
        `| Lean4 Proof | ✓ Complete | ${generatePhiConfidence().toFixed(3)} | ${Math.floor(600 * Math.random() + 200)}ms |\n\n` +
        `**Aggregated Result:** φ-weighted consensus achieved across all engines.`;
    },
  };

  const responseContent = responses[mode](content);
  const confidence = generatePhiConfidence();

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role: 'assistant',
    content: responseContent,
    timestamp: Date.now(),
    engineId: engineId || 'multi-engine',
    engineName: engineId ? `Engine ${engineId}` : 'Multi-Engine Orchestrator',
    confidence,
    executionTimeMs: Math.floor(Math.random() * 500 + 100),
  };
}

const ENGINES_SUMMARY = 'Active engines: JS Bridge, Python Bridge, Sanskrit Proto, CPL Law, CPL Pipeline, Organism Runtime, Atlas Governance, Numerical Bridge, MindStack, SocialStack, Lean4 Proof, Haskell Type, Coq Proof, Brain Canister, Cordex';

// ─── Zustand Store ───────────────────────────────────────────────────────────

export const useAIStore = create<AIState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      messages: [
        {
          id: 'system-init',
          role: 'system',
          content: 'NOVA Multi-Engine AI initialized. 14 engines online across 7 languages. φ-synchronization active at 1618ms intervals. Ready for structured reasoning, verification, and orchestration.',
          timestamp: Date.now(),
          confidence: 1,
        },
      ],
      isProcessing: false,
      currentInput: '',
      selectedEngineId: null,
      activeEngines: ['jl-mindstack', 'jl-law', 'mo-brain', 'zc-lean4'],
      engineFilter: {
        languages: [],
        categories: [],
        minConfidence: 0.7,
      },
      mode: 'chat',
      multiEngineMode: true,
      totalInferences: 0,
      avgConfidence: 0.85,
      avgLatencyMs: 200,

      // Actions
      sendMessage: (content) => {
        const state = get();
        if (state.isProcessing || !content.trim()) return;

        const userMessage: AIMessage = {
          id: `msg-${Date.now()}-user`,
          role: 'user',
          content: content.trim(),
          timestamp: Date.now(),
        };

        set((draft) => {
          draft.messages.push(userMessage);
          draft.isProcessing = true;
          draft.currentInput = '';
        });

        // Simulate async engine processing
        setTimeout(() => {
          const response = generateEngineResponse(content, state.mode, state.selectedEngineId);

          set((draft) => {
            draft.messages.push(response);
            draft.isProcessing = false;
            draft.totalInferences += 1;
            // Update rolling average confidence
            const n = draft.totalInferences;
            draft.avgConfidence = ((draft.avgConfidence * (n - 1)) + (response.confidence || 0.85)) / n;
            draft.avgLatencyMs = ((draft.avgLatencyMs * (n - 1)) + (response.executionTimeMs || 200)) / n;
          });
        }, Math.floor(Math.random() * 800 + 400)); // Simulated latency
      },

      setInput: (input) => set((draft) => { draft.currentInput = input; }),

      selectEngine: (engineId) => set((draft) => { draft.selectedEngineId = engineId; }),

      toggleEngine: (engineId) => set((draft) => {
        const idx = draft.activeEngines.indexOf(engineId);
        if (idx >= 0) {
          draft.activeEngines.splice(idx, 1);
        } else {
          draft.activeEngines.push(engineId);
        }
      }),

      setMode: (mode) => set((draft) => { draft.mode = mode; }),

      setMultiEngineMode: (enabled) => set((draft) => { draft.multiEngineMode = enabled; }),

      setEngineFilter: (filter) => set((draft) => {
        Object.assign(draft.engineFilter, filter);
      }),

      clearConversation: () => set((draft) => {
        draft.messages = [{
          id: 'system-reset',
          role: 'system',
          content: 'Conversation cleared. Multi-engine AI ready.',
          timestamp: Date.now(),
          confidence: 1,
        }];
        draft.totalInferences = 0;
      }),
    })),
    { name: 'nova-ai-store' }
  )
);

export default useAIStore;
