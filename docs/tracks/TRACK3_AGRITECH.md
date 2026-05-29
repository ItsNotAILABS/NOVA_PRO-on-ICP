# Track 3: AgriTech / Climate — Production Guide

## Overview

Blockchain-powered precision agriculture with on-chain monitoring, water management, biosecurity, and climate resilience scoring. This track targets impact funding (climate VCs, government grants, international development).

## Canisters

| Canister | File | Function |
|----------|------|----------|
| `agronomist` | `src/organisms/agronomist/main.mo` | Precision agriculture intelligence |
| `aquaflow` | `src/organisms/aquaflow/main.mo` | Water management & irrigation optimization |
| `biosentry` | `src/organisms/biosentry/main.mo` | Biosecurity threat detection & alerts |
| `cultivar` | `src/organisms/cultivar/main.mo` | Crop genetics & variety selection |
| `phenologix` | `src/organisms/phenologix/main.mo` | Phenology tracking (growth stage modeling) |
| `terragenesis` | `src/organisms/terragenesis/main.mo` | Land/terrain modeling & soil analysis |
| `resiliex` | `src/organisms/resiliex/main.mo` | Climate resilience scoring |

## Product Vision

```
┌─────────────────────────────────────────────────────────────────┐
│ FARMER / AGRONOMIST DASHBOARD                                    │
│  • Real-time field monitoring (IoT → canister)                  │
│  • Water usage optimization (aquaflow)                          │
│  • Biosecurity alerts (biosentry)                               │
│  • Crop growth predictions (phenologix)                         │
│  • Climate risk score (resiliex)                                │
│  • Variety recommendations (cultivar)                           │
├─────────────────────────────────────────────────────────────────┤
│ ON-CHAIN DATA LAYER (IC Mainnet)                                │
│  • Immutable audit trail of all sensor readings                 │
│  • Transparent supply chain provenance                          │
│  • Verifiable climate impact metrics                            │
│  • Cross-farm data marketplace (anonymized)                     │
├─────────────────────────────────────────────────────────────────┤
│ IoT INTEGRATION LAYER                                            │
│  • Soil moisture sensors → agronomist                           │
│  • Weather stations → phenologix                                │
│  • Water flow meters → aquaflow                                 │
│  • Camera traps → biosentry                                     │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment

```bash
# Deploy AgriTech track
./scripts/deploy-mainnet.sh agritech

# Initialize
dfx canister call agronomist initialize --network ic
dfx canister call aquaflow initialize --network ic
dfx canister call biosentry initialize --network ic
```

## Revenue Model

| Source | Mechanism | Target |
|--------|-----------|--------|
| Per-hectare SaaS | Monthly subscription per monitored hectare | $2-5/hectare/month |
| Data marketplace | Farmers sell anonymized data to researchers | 20% commission |
| Carbon credits | Verified on-chain climate actions → carbon offsets | Per-ton pricing |
| Enterprise license | Large farms / cooperatives | $50K-$200K/year |
| Government contracts | National agricultural monitoring | $100K-$1M |

## Funding Sources

1. **EU Horizon Europe** — Agritech + blockchain + climate (€500K-€2M grants)
2. **USDA SBIR/STTR** — Phase I: $150K, Phase II: $1M
3. **World Bank** — Digital agriculture initiatives in developing nations
4. **Breakthrough Energy** — Bill Gates' climate tech fund
5. **Lowercarbon Capital** — Climate-focused VC
6. **CGIAR** — International agricultural research funding
7. **FAO** — UN Food and Agriculture Organization digital tools

## Go-to-Market

### Phase 1: Proof of Concept (8 weeks)
- Deploy 3 core canisters (agronomist, aquaflow, biosentry)
- Build minimal farmer dashboard
- Partner with 1 pilot farm (ideally organic/regenerative)
- Collect 30 days of sensor data on-chain

### Phase 2: Validation (12 weeks)
- Expand to 5-10 farms
- Add cultivar + phenologix for crop recommendations
- Generate first climate resilience reports
- Apply for EU Horizon or USDA SBIR funding

### Phase 3: Scale (6 months)
- White-label platform for agricultural cooperatives
- Data marketplace launch
- Carbon credit integration
- Enterprise sales team

## Impact Metrics (for grant applications)

- Hectares monitored on-chain
- Water saved (liters) via aquaflow optimization
- Biosecurity threats detected early
- Carbon sequestration verified
- Farmers onboarded
- Food waste reduced through better phenology predictions
