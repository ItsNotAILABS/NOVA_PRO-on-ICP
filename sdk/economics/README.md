# @medina/token-economics

**The Complete Token Economics SDK for the Native Nova Protocol**

Casa de Medina — Architectos de Architectura Inteligente

---

## Overview

This SDK provides the full economic toolkit for building on the Native Nova Protocol. All models are grounded in φ (the golden ratio) and implement the specifications from the Alpha Economics Charter (AEC-2026).

## Modules

### `behavioral` — Prospect Theory & Nudge Design
- Prospect theory value function (Kahneman-Tversky with φ parameters)
- Hyperbolic discounting for vesting period design
- Probability weighting (Prelec function)
- Herding/social proof index
- Nudge effectiveness scoring

### `managerial` — Cost Curves & Resource Allocation
- Marginal cost of compute (ICP cycles → NNC pricing)
- Economies of scale analysis
- Principal-agent incentive compatibility checks
- Transaction cost analysis (make-vs-buy decisions)
- Heartbeat savings computation

### `velocity` — MV=PQ & Token Analysis
- Token velocity computation and health assessment
- Sink/source flow mapping
- φ-harmonic price equilibrium
- Fibonacci retracement levels
- Monte Carlo simulation framework

### `market` — AMM & Market Microstructure
- φ-weighted constant product AMM
- Liquidity provisioning and impermanent loss
- Circuit breaker logic
- Anti-manipulation detection
- Limit orderbook simulation

## Usage

```javascript
import { behavioral, managerial, velocity, market } from '@medina/token-economics';

// How much does a 100 NOVA loss hurt vs a 100 NOVA gain?
const lossRatio = behavioral.lossGainRatio(100);
// ≈ 2.618 (losses hurt φ² times more than gains feel good)

// What's the minimum reward to motivate staking with 5% slash risk?
const minReward = behavioral.minimumMotivatingReward(1000, 0.05);

// Is this operation cheaper to do locally or cross-canister?
const decision = managerial.makeVsBuy(0.5, 200);
// { decision: 'integrate', localCost: ..., crossCost: ..., ratio: ... }

// Check economic health
const report = velocity.economicHealthReport({
  circulatingSupply: 30_000_000_000,
  txVolumeThisEpoch: 5_000_000_000,
  marketPrice: 1.2,
  treasuryICP: 100,
  steadyEarnings: 10,
});

// Compute AMM swap output
const output = market.swapOutput(1000, 50000, 80000);
```

## φ Constants

All parameters derive from the golden ratio:

| Constant | Value | Use |
|----------|-------|-----|
| φ | 1.618... | Base multiplier |
| 1/φ | 0.618... | Discount rate, gain/loss sensitivity |
| φ² | 2.618... | Loss aversion, NNC premium |
| φ³ | 4.236... | Endowment multiplier, slash severity |
| φ⁴ | 6.854... | Circuit breaker threshold |

## Charter Compliance

This SDK implements specifications from:
- **AEC-2026** — Alpha Economics Charter (master)
- **TC-AEC-2026** — Token Creation Sub-Charter
- **BE-AEC-2026** — Behavioral Economics Sub-Charter
- **ME-AEC-2026** — Managerial Economics Sub-Charter
- **TA-AEC-2026** — Token Analysis Sub-Charter

---

**Version: 0.1.618**
