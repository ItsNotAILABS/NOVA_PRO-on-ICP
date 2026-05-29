# NOVA Protocol — Funding & Production Roadmap

**Casa de Medina — Architectos de Architectura Inteligente**

---

## Executive Summary

The Native Nova Protocol is a vertically integrated, sovereign AI + DeFi + real-world-application platform deployed on the Internet Computer (ICP). The protocol comprises **65+ autonomous canisters** (smart contracts), a **TypeScript AI SDK**, **ICRC-1/2 token economics**, and **SNS DAO governance** — all production-ready for mainnet deployment.

**One sovereign protocol. Five fundable tracks. One company.**

---

## Protocol Architecture (Vertically Integrated)

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOVERNANCE LAYER                               │
│  sns_dao · ssn_gov · praesidium · custos · sovereign             │
├─────────────────────────────────────────────────────────────────┤
│                    INTELLIGENCE LAYER                             │
│  brain · agi_main · turing · braindex · cerebex · cordex         │
│  TypeScript SDK: nova-os-sdk (23 native engines)                 │
├─────────────────────────────────────────────────────────────────┤
│                    FINANCIAL LAYER                                │
│  nova_token (ICRC-1/2) · ssn_work/trust/gov (Rust ICRC-1)       │
│  cycles_market · revenue_engine · divi · auto_market             │
│  nns_proxy (200-neuron fleet) · icp_coverage                     │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                              │
│  agronomist · aquaflow · biosentry · cultivar · phenologix       │
│  Desktop AGI · 20 Browser Extensions · PWA                       │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                           │
│  cloud_engine · protocol_engine · guardian · oracle               │
│  meshweaver · signalforge · netmind                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Five Fundable Tracks

### 🟢 Track 1: DeFi / Token Infrastructure

| Metric | Value |
|--------|-------|
| **Funding Potential** | $250K–$2M+ |
| **Time to Production** | 4–6 weeks |
| **Revenue Model** | Transaction fees (10,000 e8s/transfer), cycle margins (φ² premium), staking rewards |
| **Canisters** | nova_token, ssn_work, ssn_trust, ssn_gov, cycles_market, revenue_engine, divi, auto_market, nns_proxy, icp_coverage |

**Funding Sources:**
- DFINITY Developer Grant Program (up to $100K)
- SNS Decentralization Swap (community-funded; `sns_init.yaml` configured)
- ICP.Lab / Olympus Accelerator
- DeFi-focused VCs (Polychain, a16z crypto, Paradigm)

**Production Checklist:**
- [ ] Deploy nova_token to IC mainnet
- [ ] Deploy SSN Rust tokens (ssn_work, ssn_trust, ssn_gov)
- [ ] Deploy cycles_market with NNC pricing
- [ ] Activate revenue_engine epoch model
- [ ] Launch SNS swap (50 min participants, 10-500 ICP)
- [ ] Configure 200-neuron NNS fleet via nns_proxy

---

### 🟢 Track 2: AI-on-Chain Platform

| Metric | Value |
|--------|-------|
| **Funding Potential** | $500K–$5M |
| **Time to Production** | 6–8 weeks |
| **Revenue Model** | Pay-per-inference in NOVA tokens, SDK licensing, enterprise API |
| **Canisters** | brain, agi_main, turing, braindex, cerebex, cordex |
| **SDK** | nova-os-sdk (npm package, 23 engines, tokenizer) |

**Funding Sources:**
- DFINITY AI Grants (actively funding AI-on-ICP)
- a16z crypto / Polychain (AI × crypto narrative)
- Decentralized AI narrative VCs
- Enterprise partnerships

**Production Checklist:**
- [ ] Publish nova-os-sdk to npm
- [ ] Deploy brain + agi_main to mainnet
- [ ] Launch Desktop AGI app (Electron/Tauri)
- [ ] Integrate tokenized compute (pay NOVA for inference)
- [ ] Developer documentation & API reference
- [ ] 3 example apps using the SDK

---

### 🟡 Track 3: AgriTech / Climate

| Metric | Value |
|--------|-------|
| **Funding Potential** | $100K–$1M |
| **Time to Production** | 8–12 weeks |
| **Revenue Model** | SaaS subscriptions, per-hectare pricing, data marketplace |
| **Canisters** | agronomist, aquaflow, biosentry, cultivar, phenologix, terragenesis, resiliex |

**Funding Sources:**
- Climate/impact VCs (Breakthrough Energy, Lowercarbon)
- EU Horizon Europe grants (agritech + blockchain)
- USDA SBIR/STTR grants
- World Bank digital agriculture initiatives

**Production Checklist:**
- [ ] Deploy agronomist + aquaflow + biosentry to mainnet
- [ ] Build farmer-facing dashboard (React/Svelte frontend)
- [ ] Partner with 1 pilot farm for proof of concept
- [ ] Integrate IoT sensor data pipeline
- [ ] Climate resilience scoring algorithm (resiliex)

---

### 🟡 Track 4: Sovereign Cloud / Infrastructure

| Metric | Value |
|--------|-------|
| **Funding Potential** | $200K–$2M |
| **Time to Production** | 10–14 weeks |
| **Revenue Model** | Hosting fees, oracle subscriptions, enterprise contracts |
| **Canisters** | cloud_engine, protocol_engine, guardian, oracle, netmind, meshweaver, signalforge |

**Funding Sources:**
- Enterprise blockchain grants
- Government/defense (sovereign cloud narrative)
- ICP ecosystem infrastructure grants

---

### 🟡 Track 5: Governance-as-a-Service

| Metric | Value |
|--------|-------|
| **Funding Potential** | $50K–$500K |
| **Time to Production** | 6–10 weeks |
| **Revenue Model** | DAO setup fees, governance consulting, SaaS |
| **Canisters** | sns_dao, ssn_gov, praesidium, custos, sovereign |

**Funding Sources:**
- ICP ecosystem grants
- DAO tooling-focused VCs
- Protocol partnerships (white-label governance)

---

## Token Economics Summary

| Token | Standard | Supply | Fee | Purpose |
|-------|----------|--------|-----|---------|
| **NOVA** | ICRC-1/2 | φ¹³ × 10⁸ ≈ 521M e8s | 10,000 e8s (burn) | Governance + utility |
| **SSN-WORK** | ICRC-1 (Rust) | Mintable | 100 e8s | Meritocratic work rewards |
| **SSN-TRUST** | ICRC-1 (Rust) | Mintable | 100 e8s | Trust/reputation score |
| **SSN-GOV** | ICRC-1 (Rust) | Mintable | 100 e8s | Governance weight |

**Revenue Distribution (Golden Ratio):**
- 38.196% → Governance (NNS staking compounds)
- 23.607% → Market (NNC depth replenishment)
- 23.607% → DAO Treasury
- 14.590% → Operator Reserve
- Residual → Deflationary burn

---

## SNS Decentralization Swap (Pre-Configured)

| Parameter | Value |
|-----------|-------|
| Min participants | 50 |
| Min ICP | 10 ICP total |
| Max ICP | 500 ICP total |
| Per-participant min | 1 ICP |
| Per-participant max | 50 ICP |
| Duration | 14 days |
| Swap rate | 1 ICP → 1,618 NOVA e8s |
| Neuron basket | 5 neurons per participant |
| Dissolve intervals | 90-day Fibonacci tiers |

**Status:** `sns_init.yaml` configured and ready. Requires NNS proposal submission.

---

## Immediate Actions

| # | Action | Impact | Effort |
|---|--------|--------|--------|
| 1 | Deploy `nova_token` to mainnet | Proves execution, enables trading | 1 day |
| 2 | Publish `nova-os-sdk` to npm | Credibility, developer adoption | 1 day |
| 3 | Submit SNS proposal to NNS | Self-funding via decentralization swap | 1 week |
| 4 | Apply to DFINITY Developer Grants | Up to $100K funding | 2 days |
| 5 | Launch Desktop AGI demo | Visual demo for pitch decks | 1 week |
| 6 | Deploy AI canisters (brain, turing) | Live AI-on-chain product | 3 days |

---

## How to Deploy

### Quick Deploy (DeFi Track)
```bash
# 1. Type-check all canisters
./scripts/nova check

# 2. Build WASM (Motoko)
./scripts/nova build

# 3. Build Rust canisters
cargo build --target wasm32-unknown-unknown --release

# 4. Deploy to mainnet
dfx deploy nova_token --network ic
dfx deploy cycles_market --network ic
dfx deploy revenue_engine --network ic
dfx deploy ssn_work --network ic
dfx deploy ssn_trust --network ic
dfx deploy ssn_gov --network ic
```

### Publish SDK
```bash
# Build TypeScript
npm run build

# Run tests
npm test

# Publish to npm
npm publish --access public
```

### GitHub Actions (Automated)
- **Manual deploy:** Actions → "Deploy to IC Mainnet" → Select track → Run
- **SDK publish:** Actions → "Publish SDK to npm" → Select version bump → Run
- **On release tag:** Both workflows trigger automatically

---

## Contact

**Casa de Medina — Architectos de Architectura Inteligente**

- Protocol: https://nova-protocol.io
- Repository: https://github.com/ItsNotAILABS/NOVA_PRO-on-ICP
- SNS DAO: Pending NNS proposal
