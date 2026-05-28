# Track 1: DeFi / Token Infrastructure — Production Guide

## Overview

The DeFi track is the highest-priority, self-funding track. It enables the protocol to generate revenue from day one through transaction fees, cycle margins, and NNS staking rewards.

## Canisters

| Canister | File | Function |
|----------|------|----------|
| `nova_token` | `src/organisms/nova_token/main.mo` | ICRC-1/2 sovereign token (10,000 e8s fee, deflationary) |
| `ssn_work` | `src/organisms/ssn_work/src/lib.rs` | Rust ICRC-1 — work contribution rewards |
| `ssn_trust` | `src/organisms/ssn_trust/src/lib.rs` | Rust ICRC-1 — trust/reputation scoring |
| `ssn_gov` | `src/organisms/ssn_gov/src/lib.rs` | Rust ICRC-1 — governance voting weight |
| `cycles_market` | `src/organisms/cycles_market/main.mo` | NNC marketplace (φ² premium over raw ICP cycles) |
| `revenue_engine` | `src/organisms/revenue_engine/main.mo` | Golden distribution of epoch revenue |
| `divi` | `src/organisms/divi/main.mo` | AI economic orchestrator |
| `auto_market` | `src/organisms/auto_market/main.mo` | Four-engine autonomous cycle mint |
| `nns_proxy` | `src/organisms/nns_proxy/main.mo` | 200-neuron NNS fleet for compound staking |
| `icp_coverage` | `src/organisms/icp_coverage/main.mo` | Protocol-wide ICP position tracker |

## Revenue Model

```
┌─────────────────────────────────────────────────────────────────┐
│ INCOME STREAMS                                                   │
├─────────────────────────────────────────────────────────────────┤
│ 1. NNS Rewards        10-15% APY on staked ICP (200 neurons)    │
│ 2. Cycle Margin       φ² - 1 = 161.8% premium on NNC sales     │
│ 3. Developer Fees     1% on canister slot deployments            │
│ 4. SNS Swap           10-500 ICP from decentralization sale     │
│ 5. Unwrap Premium     61.8% retained on NNC→ICP redemption      │
│ 6. Transfer Fees      10,000 e8s burned per NOVA transfer        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼ revenue_engine (golden distribution)
┌─────────────────────────────────────────────────────────────────┐
│ DISTRIBUTION                                                     │
├─────────────────────────────────────────────────────────────────┤
│ 38.196% → Governance (compound via nns_proxy)                    │
│ 23.607% → Market (NNC depth in cycles_market)                    │
│ 23.607% → DAO Treasury (sns_dao)                                 │
│ 14.590% → Operator Reserve                                       │
│ Residual → Deflationary burn (nova_token.burn())                 │
└─────────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### 1. Prerequisites
```bash
# Install dfx
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Ensure you have cycles (need ~10T cycles for all DeFi canisters)
dfx wallet balance --network ic

# Ensure Rust WASM target is installed
rustup target add wasm32-unknown-unknown
```

### 2. Type-Check & Build
```bash
# Type-check all Motoko
./scripts/nova check

# Build WASM
./scripts/nova build

# Build Rust canisters
cargo build --target wasm32-unknown-unknown --release
```

### 3. Deploy
```bash
# Deploy all DeFi canisters
./scripts/deploy-mainnet.sh defi

# Or deploy individually
dfx deploy nova_token --network ic
dfx deploy cycles_market --network ic
dfx deploy revenue_engine --network ic
```

### 4. Initialize
```bash
# Initialize each canister (idempotent)
dfx canister call nova_token initialize --network ic
dfx canister call cycles_market initialize --network ic
dfx canister call revenue_engine initialize --network ic
```

### 5. Verify
```bash
# Check ICRC-1 metadata
dfx canister call nova_token icrc1_name --network ic
dfx canister call nova_token icrc1_symbol --network ic
dfx canister call nova_token icrc1_fee --network ic

# Check revenue engine
dfx canister call revenue_engine getRunningBalance --network ic
```

## SNS Launch Procedure

1. **Prepare:** Ensure all DeFi canisters are deployed and initialized
2. **Submit:** File NNS proposal referencing `sns_init.yaml`
3. **Swap:** 14-day window for community participation (50+ participants, 10-500 ICP)
4. **Activate:** On successful swap, SNS governance takes control of all canisters
5. **Compound:** nns_proxy begins accumulating NNS voting rewards

## Funding Application Points

When applying for grants, emphasize:
- **Live on mainnet** — not a whitepaper, actual deployed canisters
- **Self-sustaining** — revenue engine generates returns from day 1
- **ICRC compliant** — standard token interfaces for ecosystem integration
- **SNS ready** — decentralization swap configured for community ownership
- **φ-grounded economics** — mathematically proven distribution ratios
