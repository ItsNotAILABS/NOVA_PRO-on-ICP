# TOKEN ANALYSIS SUB-CHARTER (TA-AEC-2026)

**Casa de Medina — Architectos de Architectura Inteligente**

**Official Designation: TA-AEC-2026-MEDINA**  
**Parent Charter: AEC-2026-MEDINA (Alpha Economics Charter)**  
**Classification: Sub-Charter — Token Analysis & Quantitative Modeling**  
**Prior Art: June 2026**

---

> *This Sub-Charter defines the quantitative analysis framework for NOVA token economics.
> It specifies velocity models, sink/source mapping, equilibrium analysis, and simulation
> parameters used to monitor, predict, and stress-test the protocol's economic health.*

---

## SECTION 1: VELOCITY ANALYSIS (MV = PQ)

### 1.1 Quantity Theory Applied to NOVA

```
Fisher Equation (adapted for token economies):
  M × V = P × Q

Where:
  M = Money supply (circulating NOVA, in e8s)
  V = Velocity (average number of times each token transacts per epoch)
  P = Price level (NOVA price in ICP terms)
  Q = Real output (total economic activity in the protocol per epoch)

NOVA Definitions:
  M = TOTAL_SUPPLY_E8S - totalBurned - totalLocked
    = circulating supply (free + actively trading)
  V = total_tx_volume_e8s / M (per epoch)
  P = market_price (from AMM or oracle)
  Q = V × M / P = real protocol throughput
```

### 1.2 Velocity Targets

```
Optimal Velocity Range:
  V_target ∈ [1/φ², φ²] = [0.382, 2.618] per epoch

  V < 1/φ²: Token is being hoarded → deflation spiral risk
    Response: Reduce staking rewards (make holding less attractive)
    
  V > φ²: Token is churning too fast → no store-of-value function
    Response: Increase transfer fees, increase lockup incentives
    
  V ≈ 1: Healthy equilibrium (each token used ~once per epoch)
    This is the target steady state.

Velocity Decomposition:
  V = V_transfers + V_staking + V_governance + V_compute
  
  V_transfers = pure P2P movement volume / M
  V_staking = stake/unstake volume / M
  V_governance = lock/unlock for voting / M
  V_compute = cycle purchase volume / M
```

### 1.3 Velocity Monitoring

```
Real-time metrics (computed by token_economics canister):
  1. Rolling velocity (last 5 epochs, weighted by φ^(-age))
  2. Velocity by role tag (#Free velocity vs #Gov velocity)
  3. Velocity distribution (Gini coefficient of per-account velocity)
  4. Velocity trend (increasing/decreasing/stable)

Alert Thresholds:
  V > φ³ ≈ 4.236: CRITICAL — excessive speculation
  V > φ² ≈ 2.618: WARNING — elevated activity
  V < 1/φ² ≈ 0.382: WARNING — liquidity drought
  V < 1/φ³ ≈ 0.236: CRITICAL — frozen economy
```

---

## SECTION 2: TOKEN SINK/SOURCE MAPPING

### 2.1 Source Taxonomy (Token Creation Points)

```
┌─────────────────────────────────────────────────────────┐
│                    SOURCES (Inflow)                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Genesis Mint] ─────→ Treasury (38.2%)                 │
│                 ─────→ Community (23.6%)                 │
│                 ─────→ Founder (38.2%)                   │
│                                                          │
│  [Epoch Rewards] ───→ Governance voters (61.8% of budget)│
│                  ───→ Validators (38.2% of budget)       │
│                                                          │
│  [Treasury Release] → Ecosystem grants (governance vote) │
│                                                          │
└─────────────────────────────────────────────────────────┘

Source Rate Function:
  S(t) = I(epoch(t)) + grants(t)
  
  Where I(epoch) follows the Fibonacci issuance schedule (TC-AEC-2026)
  And grants(t) is governance-approved (irregular, bounded)
```

### 2.2 Sink Taxonomy (Token Destruction/Lock Points)

```
┌─────────────────────────────────────────────────────────┐
│                     SINKS (Outflow)                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Transfer Fee Burn] ── 10,000 e8s per ICRC-1 transfer  │
│                                                          │
│  [Cycle Redemption] ─── NOVA → NNC (NOVA burned)        │
│                                                          │
│  [Governance Slash] ─── φ³ × violation (burned)          │
│                                                          │
│  [Voluntary Burn] ───── User-initiated destruction       │
│                                                          │
│  [Epoch Decay] ──────── Unclaimed rewards (burned)       │
│                                                          │
│  [Gov Lock] ─────────── #Free → #Gov (soft sink, locked) │
│                                                          │
│  [Vault Reserve] ────── #Free → #Vault (deep lock)       │
│                                                          │
└─────────────────────────────────────────────────────────┘

Sink Rate Function:
  K(t) = fees_burned(t) + redemptions(t) + slashes(t) + decay(t) + voluntary(t)
```

### 2.3 Net Flow Analysis

```
Net Supply Change:
  ΔM(t) = S(t) - K(t)
  
  If ΔM > 0: Inflationary period (sources > sinks)
  If ΔM < 0: Deflationary period (sinks > sources)
  If ΔM = 0: Equilibrium

Target: ΔM → 0 as protocol matures
  Early epochs: ΔM > 0 (issuance dominates, building user base)
  Mature epochs: ΔM < 0 (burns dominate, increasing scarcity)
  Steady state: ΔM ≈ 0 (governance adjusts to maintain balance)

Sink-Source Ratio:
  SSR(t) = K(t) / S(t)
  SSR < 1: Inflating
  SSR = 1: Equilibrium
  SSR > 1: Deflating
  
  Target trajectory: SSR rises from 0 → 1 over first 13 epochs, then oscillates near 1.
```

### 2.4 Per-Organism Flow Map

```
Each organism has a flow profile:

nova_token:     NET SOURCE (minting authority)
cycles_market:  NET SINK (NOVA burned for NNC)
ssn_token:      NEUTRAL (staking locks but doesn't destroy)
revenue_engine: NET SOURCE (distributes earnings)
sns_dao:        NEUTRAL (governance, no direct token effect)
brain:          MINIMAL (small cycle consumption only)
divi:           NET SINK (market operations consume NOVA fees)

Total protocol flow must satisfy:
  Σ(organism_net_flow) = ΔM(t)
```

---

## SECTION 3: φ-HARMONIC PRICE EQUILIBRIUM MODELS

### 3.1 Equilibrium Price Theory

```
The NOVA token has a fundamental value derived from:
  P_fundamental = (Treasury_backing + PV(future_earnings)) / circulating_supply

Treasury Backing:
  Floor price = treasury_ICP_value / circulating_NOVA
  This provides a HARD FLOOR — below this price, treasury buyback triggers.

Future Earnings (DCF with φ-discount):
  PV = Σ(earnings(epoch_n) × φ^(-n), n=0..∞)
  = Σ(NNC_revenue × margin × φ^(-n))
  
  At steady state earnings E:
    PV = E / (1 - 1/φ) = E / (1/φ) = E × φ
    
  Fundamental price: P* = (Treasury + E×φ) / M_circulating
```

### 3.2 φ-Harmonic Price Levels

```
From any reference price P_ref, natural support/resistance forms at:

Fibonacci Levels:
  Level    | Ratio    | Derivation
  ---------|----------|------------------
  23.6%    | 1/φ³    | P_ref × (1 - 1/φ³)
  38.2%    | 1/φ²    | P_ref × (1 - 1/φ²)
  50.0%    | 1/φ^1.44| P_ref × 0.5 (midpoint)
  61.8%    | 1/φ     | P_ref × (1 - 1/φ)
  78.6%    | 1/√φ    | P_ref × (1 - 1/φ^0.5)
  100%     | 1       | P_ref × 1 (full retracement)

Support Levels (below P_ref):
  S1 = P_ref × 1/φ     ≈ P_ref × 0.618
  S2 = P_ref × 1/φ²    ≈ P_ref × 0.382
  S3 = P_ref × 1/φ³    ≈ P_ref × 0.236

Resistance Levels (above P_ref):
  R1 = P_ref × φ       ≈ P_ref × 1.618
  R2 = P_ref × φ²      ≈ P_ref × 2.618
  R3 = P_ref × φ³      ≈ P_ref × 4.236

These levels are COMPUTED and PUBLISHED by the token_economics canister.
```

### 3.3 Mean-Reversion Model

```
Price dynamics (Ornstein-Uhlenbeck with φ-parameters):
  dP = θ × (μ - P) × dt + σ × dW

  Where:
    θ = 1/φ (mean-reversion speed — pulls back to fundamental)
    μ = P_fundamental (long-run equilibrium price)
    σ = historical volatility (empirical)
    dW = Wiener process (random noise)

Interpretation:
  - Price deviations from fundamental revert at rate 1/φ per epoch
  - Half-life of deviation: t_half = ln(2)/θ = ln(2)×φ ≈ 1.12 epochs
  - After φ epochs: deviation reduced to 1/e ≈ 36.8% of original
  
Treasury Intervention Triggers:
  If P < P_fundamental × 1/φ: Treasury buys (support)
  If P > P_fundamental × φ: Treasury sells (cap excessive speculation)
```

---

## SECTION 4: FIBONACCI RETRACEMENT FOR GOVERNANCE EPOCHS

### 4.1 Epoch Pricing Model

```
Each governance epoch has a characteristic price range:

Epoch Price Band:
  P_high(n) = P_start(n) × φ^(issuance_weight(n))
  P_low(n) = P_start(n) × φ^(-issuance_weight(n))
  
  Where issuance_weight(n) = φ^(-n) (from issuance schedule)

Expected Behavior:
  Early epochs (high issuance): wider price bands, more volatility
  Later epochs (low issuance): narrow bands, price stability
  
  Epoch 0: Band = P × [φ^(-1), φ^1] = P × [0.618, 1.618] (±61.8%)
  Epoch 6: Band = P × [φ^(-0.056), φ^0.056] = P × [0.973, 1.027] (±2.7%)
  Epoch 12: Band = P × [φ^(-0.003), φ^0.003] = P × [0.999, 1.001] (±0.1%)
```

### 4.2 Cross-Epoch Fibonacci Retracements

```
Between epoch transitions:
  If price rose in epoch N (P_end > P_start):
    Expected retracement levels in epoch N+1:
      23.6% retrace: P_end - 0.236 × (P_end - P_start)
      38.2% retrace: P_end - 0.382 × (P_end - P_start)
      61.8% retrace: P_end - 0.618 × (P_end - P_start)
    
  If price fell in epoch N:
    Expected bounce levels in epoch N+1:
      23.6% bounce: P_end + 0.236 × (P_start - P_end)
      38.2% bounce: P_end + 0.382 × (P_start - P_end)
      61.8% bounce: P_end + 0.618 × (P_start - P_end)

These are INFORMATIONAL (published by token_economics) not enforced.
```

---

## SECTION 5: MONTE CARLO SIMULATION PARAMETERS

### 5.1 Simulation Framework

```
The protocol runs Monte Carlo simulations for stress testing:

Simulation Engine: protocols/economics/token-velocity.js
Canister Reporting: src/organisms/token_economics/main.mo

Parameters per simulation run:
  - Time horizon: 13 epochs (full cycle)
  - Iterations: φ^8 ≈ 47 runs per scenario (statistically robust)
  - Random seed: φ-derived (golden ratio quasi-random sequence)
  - Output: distribution of {price, velocity, supply, TVL}
```

### 5.2 Stochastic Variables

```
Each simulation varies these parameters:

| Variable | Distribution | Parameters |
|----------|-------------|------------|
| Transaction volume | Log-normal | μ=ln(10000), σ=1/φ |
| New user arrivals | Poisson | λ=φ×current_users/epoch |
| Governance participation | Beta | α=φ, β=1 |
| Compute demand | Exponential | λ=1/φ² |
| External ICP price | GBM | μ=0, σ=0.3/√epoch |
| Validator behavior | Bernoulli | p=1-1/φ⁴ (honest) |
| Burn rate multiplier | Uniform | [1/φ, φ] |

GBM = Geometric Brownian Motion
```

### 5.3 Stress Test Scenarios

```
Scenario 1: "Governance Collapse"
  - Participation drops to 1/φ⁴ (< 15%)
  - Validators go offline
  - Test: Does treasury floor hold? Does protocol survive?
  
Scenario 2: "Velocity Spike"  
  - V jumps to φ⁴ ≈ 6.854 (extreme speculation)
  - Wash trading at maximum
  - Test: Do circuit breakers activate? Is price stable?

Scenario 3: "Demand Shock"
  - Compute demand falls to 1/φ³ of baseline
  - No new NNC purchases for 3 epochs
  - Test: Revenue model sustainability? Treasury runway?

Scenario 4: "Supply Shock"
  - Large holder (>1/φ² of supply) dumps all tokens
  - Market absorbs massive sell pressure
  - Test: AMM resilience? Slippage bounds? Recovery time?

Scenario 5: "Golden Convergence" (best case)
  - All metrics converge to φ-ratios
  - V = 1, SSR = 1, participation = 1/φ
  - Test: What does "perfect" protocol state look like?

Acceptance Criteria:
  Protocol MUST survive scenarios 1-4 without:
    - Total supply violation
    - Price falling below treasury floor
    - Inability to process transactions
  Protocol SHOULD achieve scenario 5 within 13 epochs under normal conditions.
```

### 5.4 Simulation Output Metrics

```
Per run, record:
  1. Final circulating supply
  2. Final price (in ICP terms)
  3. Average velocity per epoch
  4. Maximum drawdown (price)
  5. Treasury remaining (as % of initial)
  6. Governance participation rate
  7. Number of circuit breaker activations
  8. Time to equilibrium (epochs until V ∈ [1/φ², φ²])

Aggregate across runs:
  - Mean and standard deviation of each metric
  - Value-at-Risk (VaR) at φ% confidence (61.8% percentile)
  - Conditional VaR (expected loss beyond VaR)
  - Probability of protocol failure (any invariant violation)
```

---

## SECTION 6: REAL-TIME ANALYTICS DASHBOARD

### 6.1 Key Performance Indicators (KPIs)

```
The token_economics canister exposes:

Economic Health:
  1. velocity_current: Float         — rolling V
  2. velocity_target: Float          — 1.0
  3. sink_source_ratio: Float        — current SSR
  4. net_supply_change: Int          — ΔM this epoch
  5. deflation_rate: Float           — annualized burn %

Price Analytics:
  6. price_fundamental: Float        — DCF-derived fair value
  7. price_deviation: Float          — (market - fundamental) / fundamental
  8. support_level: Float            — nearest φ-support
  9. resistance_level: Float         — nearest φ-resistance
  10. fibonacci_zone: Text           — "oversold" / "fair" / "overbought"

Behavioral Metrics:
  11. avg_lock_duration: Float       — average governance lock (weeks)
  12. participation_rate: Float      — voters / eligible
  13. delegation_rate: Float         — delegated / total_gov_locked
  14. herding_index: Float           — concentration of validator selection

Protocol Health:
  15. treasury_runway: Nat           — epochs of operation at current burn
  16. holder_count: Nat              — unique accounts
  17. gini_coefficient: Float        — wealth distribution inequality
  18. epoch_budget_remaining: Nat    — unminted allocation this epoch
```

### 6.2 Reporting Cadence

```
Heartbeat (every 2s): Update internal counters (local math only)
Per-transaction: Update velocity, sink/source tallies
Per-epoch: Generate full economic report
Per-Fibonacci-epoch: Run Monte Carlo stress test
On-demand: queryable by any canister or external caller
```

---

## APPENDIX: ANALYSIS PARAMETER REGISTRY

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Velocity target | 1.0 | Optimal transactions per token per epoch |
| Velocity low alert | 1/φ² = 0.382 | Liquidity drought warning |
| Velocity high alert | φ² = 2.618 | Excessive speculation warning |
| Mean-reversion speed | θ = 1/φ | Price pulls back to fundamental |
| Simulation runs | φ^8 ≈ 47 | Statistical robustness |
| VaR confidence | 1/φ = 61.8% | Risk metric threshold |
| Treasury floor trigger | P < P_fund/φ | Buyback activation |
| Treasury cap trigger | P > P_fund×φ | Sell activation |
| Epoch price band (early) | ±61.8% | Expected volatility range |
| Epoch price band (late) | ±2.7% | Expected stability range |
| SSR target | 1.0 | Sink/source equilibrium |
| Max Gini | 1/φ = 0.618 | Wealth concentration cap |

---

**Casa de Medina — Architectos de Architectura Inteligente**  
**TA-AEC-2026-MEDINA — Ratified June 2026**
