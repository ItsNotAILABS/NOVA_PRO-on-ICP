# Track 2: AI-on-Chain Platform — Production Guide

## Overview

The AI track is the highest-value funding opportunity. On-chain AI is the peak narrative for 2025-2026 venture capital. The Nova Protocol has a complete AI infrastructure stack: on-chain canisters for coordination + a TypeScript SDK with 23 native engines.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVELOPER INTERFACE                            │
│  npm install nova-os-sdk                                         │
│  import { boot, chat, tokenize, engines } from 'nova-os-sdk'    │
├─────────────────────────────────────────────────────────────────┤
│                    TypeScript SDK Layer                           │
│  23 Engine APIs: Cognos, Profundis, Fusio, Lingua, Stratos,     │
│  Memoria, Vector, Codex, Pictor, Kinema, Harmonia, Segmentum,   │
│  Scrutator, Custodis, Ranker, Formalis, Algorithmus, Vox,       │
│  Socialis, Empathos, Analytica, Structura, Visio                │
├─────────────────────────────────────────────────────────────────┤
│                    Desktop AGI Layer                              │
│  NovaOS · NovaDesktopAGI · NovaChatTerminal                     │
│  NovaAppController · NovaEngineComparison · MiniAI              │
├─────────────────────────────────────────────────────────────────┤
│                    On-Chain Canister Layer                        │
│  brain · agi_main · turing · braindex · cerebex · cordex         │
│  (Motoko persistent actors on IC mainnet)                        │
└─────────────────────────────────────────────────────────────────┘
```

## Canisters

| Canister | File | Function |
|----------|------|----------|
| `brain` | `src/organisms/brain/main.mo` | Central cognitive organism — memory, reasoning, audit |
| `agi_main` | `src/organisms/agi_main/main.mo` | AGI orchestrator — coordinates all intelligence |
| `turing` | `src/organisms/turing/main.mo` | Computation engine — deterministic execution |
| `braindex` | `src/organisms/braindex/main.mo` | Neural indexer — vector-like storage on-chain |
| `cerebex` | `src/organisms/cerebex/main.mo` | Cognitive processor — pattern recognition |
| `cordex` | `src/organisms/cordex/main.mo` | Coordination engine — multi-model orchestration |

## SDK Package (npm)

**Package:** `nova-os-sdk`
**Version:** 1.0.0
**Entry points:**
- `nova-os-sdk` — Full SDK (engines, tokenizer, API client)
- `nova-os-sdk/desktop` — Desktop AGI module
- `nova-os-sdk/sdk` — SDK-only (lighter)

**Key Exports:**
```typescript
// Boot & interact
boot(), chat(), think(), open(), code(), search()
imagine(), translate(), solve(), execute()

// Tokenizer
tokenize(), countTokens(), encode(), visualizeTokens(), explainTokens()

// Engine management
engines(), compareEngines(), status(), identity()

// AGI
getAGI(), getOS(), reboot(), runCLI()
```

## Deployment Steps

### 1. Deploy AI Canisters
```bash
# Type-check
./scripts/nova check

# Deploy to mainnet
./scripts/deploy-mainnet.sh ai

# Or individually
dfx deploy brain --network ic
dfx deploy agi_main --network ic
dfx deploy turing --network ic
```

### 2. Publish SDK to npm
```bash
# Build TypeScript
npm run build

# Verify exports
node -e "import('./.nova/build/organism/organism/sdk/index.js').then(m => console.log(Object.keys(m).length, 'exports'))"

# Run tests
npm test

# Publish
npm publish --access public
```

### 3. Tokenized Compute Integration
```
Developer calls SDK → SDK routes to on-chain canister → Canister charges NOVA tokens → Returns result
```

The `nova_token` ICRC-2 approve/transferFrom enables:
1. Developer approves NOVA spend to `brain` canister
2. Developer calls `brain.infer(prompt)`
3. Brain transfers NOVA fee from developer
4. Brain executes computation
5. Brain returns result

## Revenue Model

| Source | Mechanism | Revenue |
|--------|-----------|---------|
| Inference fees | NOVA per API call | Variable (φ-scaled by complexity) |
| SDK enterprise license | Annual subscription | $10K-$100K/year |
| Desktop AGI | Premium features | $19/month per user |
| Developer onboarding | Canister setup fee | 1% of cycles deposited |

## Pitch Deck Points

**For VC/Grant Applications:**
- **Market:** $150B+ AI market, decentralized AI is fastest-growing segment
- **Differentiation:** 23 native engines, zero external API dependencies
- **On-chain:** All coordination logic runs on-chain (verifiable, censorship-resistant)
- **SDK-first:** Developer-friendly npm package for instant adoption
- **Token utility:** NOVA token has real demand from compute consumption
- **Desktop app:** End-user product, not just infrastructure
- **No OpenAI dependency:** Fully sovereign AI stack

## Competitive Landscape

| Project | Approach | Nova Advantage |
|---------|----------|----------------|
| Bittensor | Incentive network for models | Nova is a full platform, not just incentives |
| Ritual | Off-chain inference with on-chain verification | Nova runs coordination logic ON-chain |
| Gensyn | Training compute marketplace | Nova is inference + orchestration + SDK |
| Akash | Generic compute | Nova is AI-native with 23 specialized engines |

## Funding Sources

1. **DFINITY AI Grants** — Actively funding AI-on-ICP projects
2. **a16z crypto** — AI × crypto thesis
3. **Polychain Capital** — ICP ecosystem fund
4. **Decentralized AI VCs** — Mechanism Capital, Pantera
5. **Enterprise partnerships** — B2B SDK licensing
