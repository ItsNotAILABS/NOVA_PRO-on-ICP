# ALPHA ECONOMICS CHARTER — Sovereign Token Economics Protocol

**Casa de Medina — Architectos de Architectura Inteligente**

**Official Designation: AEC-2026-MEDINA**  
**Charter Date: June 2026**  
**Classification: Alpha Protocol — Foundational Economics Layer**  
**Prior Art: June 2026**

---

> *This Charter is the supreme reference for all economic behavior in the Native Nova Protocol.
> It governs token creation, behavioral incentives, managerial resource allocation, and market
> microstructure. If any implementation diverges from this Charter, the implementation is wrong.*

---

## PREAMBLE

The Alpha Economics Charter (AEC) establishes the economic foundations upon which all value
flows, incentive mechanisms, and market behaviors in the Native Nova Protocol are built.

Economics is not an afterthought — it is the **substrate** of coordination. Every organism,
every canister call, every governance vote, every cycle consumed operates within the economic
field defined by this Charter.

**Governing Principles:**
- All economics are grounded in φ (the golden ratio, 1.6180339887...)
- Fibonacci sequences govern temporal dynamics (epochs, vesting, issuance)
- Behavioral economics governs agent incentive design
- Managerial economics governs resource allocation
- Market microstructure governs price discovery

**Sub-Charters (governed by this document):**
- TC-AEC-2026 — Token Creation Sub-Charter
- BE-AEC-2026 — Behavioral Economics Sub-Charter
- ME-AEC-2026 — Managerial Economics Sub-Charter
- TA-AEC-2026 — Token Analysis Sub-Charter

---

## SECTION 1: TOKEN CREATION ECONOMICS

### 1.1 Supply Architecture

The NOVA token supply is derived from the golden ratio:

```
Total Supply = φ^13 × 10^8 e8s = 52,100,196,600 e8s ≈ 521 NOVA (whole units)

Distribution (φ-harmonic):
  Treasury:   1/φ² ≈ 38.196%  = 19,918,285,500 e8s
  Community:  1/φ³ ≈ 23.607%  = 12,297,756,900 e8s
  Founder:    1/φ² ≈ 38.196%  = 19,884,154,200 e8s (vested)
```

**Why φ^13:**
- 13 is the 7th Fibonacci number
- φ^13 ≈ 521.001966 — a natural Fibonacci attractor
- The exponent 13 creates a supply that is neither scarce nor inflationary
- At 8 decimal places (e8s), the granularity matches ICP ledger precision

### 1.2 Issuance Schedule

Minting follows Fibonacci epochs. An epoch is a governance-defined time interval:

```
Epoch Sequence: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]
Base unit: 1 epoch = 7 days (initial setting, governance-adjustable)

Issuance per epoch:
  I(n) = (TOTAL_SUPPLY × PHI_INV^n) / Σ(PHI_INV^k, k=0..12)

  Where n = epoch index (0-indexed)
  PHI_INV = 1/φ ≈ 0.6180339887
```

This produces a **geometrically decreasing issuance** — early epochs receive more tokens,
later epochs approach asymptotic zero. The sum converges to TOTAL_SUPPLY.

### 1.3 Mint Triggers

Minting is **never arbitrary**. A mint event requires:

| Trigger | Amount | Role Tag | Authority |
|---------|--------|----------|-----------|
| SNS swap participation | Community allocation | #Free | SNS governance |
| Governance reward | φ^(-epoch) × base_reward | #Gov | Automatic per epoch |
| Cycle purchase (NOVA → NNC) | Treasury → buyer | #Cycle | cycles_market |
| Validator staking reward | φ% × stake × epoch_weight | #Gov | ssn_token |
| Ecosystem grant | Governance-approved | #Free | SNS proposal |

### 1.4 Deflationary Mechanics

Burns are permanent supply reduction:

```
Burn Sources:
  1. Transfer fee: 10,000 e8s per ICRC-1 transfer (burned, not collected)
  2. Cycle redemption: Unwrapping NNC → raw ICP burns the NOVA backing
  3. Governance penalty: Slashed stakes are burned, not redistributed
  4. Voluntary burn: Any holder can burn (increases protocol scarcity)

Deflation Rate:
  D(t) = transfers(t) × 10,000 + redemptions(t) × amount + slashes(t)

At equilibrium:
  Net supply change = I(epoch) - D(t)
  Target: Net supply change → 0 as t → ∞ (deflationary pressure matches issuance)
```

### 1.5 Role-Tag Economics

Each NOVA token carries a role tag determining its economic function:

```
#Free  — Liquid, transferable, tradeable. No restrictions.
#Gov   — Governance-locked. Earns voting weight. Cannot transfer until unlock.
#Cycle — Compute-access. Redeemable for Native Nova Cycles (NNC).
#Vault — Treasury-reserved. Backs the cycle floor price. Never circulates.

Transitions:
  #Free → #Gov    (Lock: voter stakes for governance power)
  #Free → #Cycle  (Lock: developer buys compute access)
  #Gov  → #Free   (Unlock: dissolve delay = Fibonacci(epoch_index) days)
  #Cycle → (burned): Redeemed for NNC, NOVA is destroyed
  #Vault → #Free  (Emergency only: requires supermajority governance vote)
```

---

## SECTION 2: TOKEN BEHAVIORAL ECONOMICS

### 2.1 Prospect Theory in Staking Decisions

Agents do not evaluate staking gains/losses linearly. We model decisions using
Kahneman-Tversky Prospect Theory with φ-calibrated parameters:

```
Value Function:
  v(x) = x^α              if x ≥ 0  (gains)
  v(x) = -λ × (-x)^β     if x < 0  (losses)

NOVA Parameters:
  α = 1/φ ≈ 0.618     (diminishing sensitivity to gains)
  β = 1/φ ≈ 0.618     (diminishing sensitivity to losses)
  λ = φ²  ≈ 2.618     (loss aversion coefficient)

Interpretation:
  - Agents feel losses 2.618× more intensely than equivalent gains
  - This means: a 1 NOVA loss hurts as much as a 2.618 NOVA gain feels good
  - Staking rewards must exceed φ² × perceived risk to motivate participation
  - Slashing penalties have φ² × deterrence effect relative to their size
```

### 2.2 Hyperbolic Discounting in Vesting

Agents discount future rewards non-linearly. The Fibonacci dissolve periods
exploit this to create optimal lockup incentives:

```
Discount Function:
  D(t) = 1 / (1 + k × t)

  Where k = 1/φ ≈ 0.618 (φ-calibrated impatience factor)

Fibonacci Dissolve Periods: [1, 1, 2, 3, 5, 8, 13, 21] weeks

Effective perceived value at unlock:
  V_perceived(n) = V_actual × D(Fibonacci(n))
  V_perceived(n) = V_actual / (1 + 0.618 × Fib(n))

Implication:
  - Short lockups (1-2 weeks): perceived value ≈ 60-70% of actual → easy sell
  - Medium lockups (5-8 weeks): perceived value ≈ 20-25% → requires high APY
  - Long lockups (13-21 weeks): perceived value < 10% → only for true believers
  - Reward scaling MUST compensate: APY(n) = base_apy × φ^(n/φ)
```

### 2.3 Anchoring in Governance Proposals

First-mover advantage in governance voting creates anchoring bias:

```
Anchoring Model:
  Final_vote_weight = initial_signal × φ + independent_analysis × (1 - 1/φ)

Mitigation:
  - Commit-reveal voting: votes hidden until reveal phase
  - φ-weighted quorum: early votes count 1/φ of final votes
  - Threshold: proposals need √φ × total_eligible_voters to reach quorum
```

### 2.4 Endowment Effect on Soulbound Tokens (SSN)

The SSN (Sovereign Soulbound Number) creates a powerful endowment effect:

```
Because SSNs are non-transferable:
  - Perceived value >> market value (there IS no market value)
  - Loss aversion amplified: losing SSN = losing identity
  - This makes governance slashing extremely powerful as deterrent:
    Slash_deterrence = actual_penalty × λ × endowment_multiplier
    Where endowment_multiplier = φ³ ≈ 4.236 (for soulbound assets)
```

### 2.5 Herding and Social Proof in Validator Selection

```
Herding Function:
  P(choose_validator_i) = stake_i^φ / Σ(stake_j^φ, j=1..N)

  This creates SUPERLINEAR preference for larger validators (φ > 1),
  modeling real herding behavior.

Mitigation (to prevent centralization):
  - Diminishing returns: rewards per stake = R × stake^(1/φ)
  - φ-cap: No validator may hold more than 1/φ² ≈ 38.2% of total stake
  - Diversity bonus: Selecting a smaller validator earns φ^(-rank) bonus
```

### 2.6 Nudge Architecture

Systematic nudges guide protocol participation:

```
Nudge Framework:
  1. Default enrollment: New SSN holders auto-stake minimum (opt-out, not opt-in)
  2. φ-framing: Display rewards as "φ× your current rate" rather than absolute
  3. Social comparison: Show "top φ% of stakers earn..." benchmarks
  4. Loss framing: Show unstaking as "you will lose X voting power" not "you gain X liquidity"
  5. Temporal: Nudge governance votes during Fibonacci epoch transitions
```

---

## SECTION 3: MANAGERIAL ECONOMICS

### 3.1 Marginal Cost of Compute

Every canister operation has a marginal cost in cycles:

```
Cost Function:
  MC(q) = base_cycles + variable_cycles × q^(1/φ)

  Where:
    base_cycles = 590_000 (ICP base cost for update call)
    variable_cycles = function of instruction count
    q = number of instructions

Pricing Rule (profit-maximizing):
  Price_NNC = MC × φ² (the φ² premium covers governance + AI value-add)

Break-even:
  At price = MC × φ², break-even quantity = fixed_costs / (MC × (φ² - 1))
  Since φ² - 1 = φ ≈ 1.618, every NNC sold at premium covers 1.618 units of overhead
```

### 3.2 Economies of Scale

```
Long-Run Average Cost:
  LRAC(N) = Fixed_costs/N + Variable_per_canister × N^(-1/φ)

  Where N = number of deployed organisms

Interpretation:
  - As N grows, average cost falls sub-linearly (exponent -1/φ ≈ -0.618)
  - This means: doubling organisms reduces per-unit cost by 2^(1/φ) ≈ 1.53×
  - Scale economics justify the cycles_market premium at N > 13 organisms
  - At N > 89 organisms: LRAC drops below raw ICP cycle cost → pure profit zone

Minimum Efficient Scale:
  N_MES = (Fixed_costs / Variable)^φ
  Below N_MES: diseconomies (overhead dominates)
  Above N_MES: economies of scale kick in
```

### 3.3 Principal-Agent Problems

```
Delegated Governance Model:
  Principal = NOVA token holders
  Agent = SNS neurons / validators

Agency Costs:
  1. Monitoring costs: On-chain audit (effecttrace, CPL runtime) → low
  2. Bonding costs: Validator stake = self-imposed collateral → aligns incentives
  3. Residual loss: Validator may vote against holder interest → bounded by slash

Incentive Compatibility Constraint:
  Validator_reward - Slash_risk × P(caught) > Outside_option
  Where:
    Validator_reward = φ% × stake × epoch_weight
    Slash_risk = φ³ × stake
    P(caught) = reputation_score (from Julia-computed SSN reputation)
    Outside_option = 0 (unique protocol, no substitutes)
```

### 3.4 Transaction Cost Economics

```
Cross-Canister Call Cost:
  TC = message_cost + async_overhead + consensus_cost

  message_cost = 590_000 + 1_000 × payload_bytes
  async_overhead = 5_000_000 (await/callback reservation)
  consensus_cost = 1_200_000 (subnet agreement)

Make-vs-Buy Decision:
  If TC(outsource) > φ × TC(local): compute locally
  If TC(outsource) < 1/φ × TC(local): outsource to specialized organism
  If 1/φ × TC(local) ≤ TC(outsource) ≤ φ × TC(local): governance decides

Application:
  Heartbeat pattern (local-only math) exists BECAUSE:
    TC(inter-canister) >> TC(local)
    This is why heartbeats do LOCAL math only — no inter-canister await calls.
```

### 3.5 Cycle Sourcing: Make vs Buy

```
Decision Matrix:
                    | Raw ICP Cycles | Native Nova Cycles (NNC)
  Cost per unit     | 1.0 (baseline) | φ² ≈ 2.618 (premium)
  Governance        | None           | Full SNS participation
  AI management     | None           | DIVI + organism suite
  Audit trail       | Basic          | φ-attested effecttrace
  Unwrap option     | N/A            | 1 NNC → 1/φ² raw cycles

Break-even analysis:
  If governance_value + ai_value + audit_value > (φ² - 1) × raw_cycle_cost
  Then: Buy NNC (premium justified)
  
  At scale: governance alone is worth > φ × raw_cost → NNC dominates
```

---

## SECTION 4: MARKET MICROSTRUCTURE

### 4.1 Order Flow in Cycles Market

```
Market Structure:
  Type: Continuous double auction (CDA) with φ-tick sizes

  Tick size: 1/φ^4 ≈ 0.146 NOVA (minimum price increment)
  Lot size: φ^8 ≈ 46.979 NNC (minimum order quantity)

  Order Types:
    - Limit: Specified price, enters book
    - Market: Immediate execution at best available
    - φ-Stop: Triggers when price crosses φ-level (φ^n from reference)

  Priority: Price-Time (standard FIFO within price level)
```

### 4.2 Liquidity Provisioning

```
Automated Market Maker (AMM) — φ-Weighted:
  Invariant: x^(1/φ) × y^(1/φ) = k^(1/φ)

  Where:
    x = NNC reserves
    y = NOVA reserves
    k = constant product (adjusted only by add/remove liquidity)

  Slippage for trade of Δx:
    Δy = y - k^(1/φ) / (x + Δx)^(1/φ)

  LP rewards:
    Fee per trade: 1/φ³ ≈ 0.236% of trade value
    Distributed pro-rata to LP token holders

  Impermanent Loss:
    IL(r) = 2×r^(1/φ) / (1 + r^(1/φ)) - 1
    Where r = price_ratio (current / entry)
    At r = φ²: IL ≈ 5.7% (acceptable for most LPs)
```

### 4.3 Price Discovery

```
Reference Price:
  P_ref = Treasury_NOVA_balance / Treasury_NNC_backing

  Oracle price (from ICP/XDR):
    P_icp = XDR_per_ICP (from NNS exchange rate canister)
    P_nova_icp = P_ref × P_icp

φ-Harmonic Price Levels:
  Support levels: P_ref × φ^(-n), n = 1, 2, 3, ...
  Resistance levels: P_ref × φ^(n), n = 1, 2, 3, ...

  These create natural Fibonacci retracement zones:
    23.6% = 1 - 1/φ³
    38.2% = 1 - 1/φ²
    50.0% = 1 - 1/φ^(log₂(φ))  ≈ midpoint
    61.8% = 1 - 1/φ
    78.6% = 1 - 1/φ^(1/2)
```

### 4.4 Market Stability Mechanisms

```
Circuit Breakers:
  Level 1: Price moves > φ² standard deviations → 1 epoch pause
  Level 2: Price moves > φ³ standard deviations → 2 epoch pause + governance alert
  Level 3: Volume > φ⁴ × average → halt + emergency SNS vote

Anti-Manipulation:
  - Wash trade detection: Same principal, both sides, within 1/φ epochs → flag
  - Front-running prevention: Commit-reveal for large orders (> φ⁸ × lot_size)
  - Concentration limit: No single account may hold > 1/φ² of total NNC liquidity
```

---

## SECTION 5: ECONOMIC LAWS (IMMUTABLE)

### LEX AEC-001 — φ-Grounding Law
```
∀ economic_parameter P in NativeNovaProtocol:
  P must be expressible as φ^n × C
  Where n ∈ ℤ and C is a rational constant
  
  No arbitrary numbers. All economics derive from φ.
```

### LEX AEC-002 — Deflationary Floor Law
```
∀ t:
  burn_rate(t) ≥ 0
  AND total_supply(t) ≤ TOTAL_SUPPLY_E8S
  AND no_function_may_mint_beyond_TOTAL_SUPPLY_E8S

  Supply is bounded above and decreasing in expectation.
```

### LEX AEC-003 — Incentive Compatibility Law
```
∀ agent A participating in protocol:
  Expected_reward(honest_behavior) > Expected_reward(deviation)
  
  Proven by:
    reward(honest) = φ% × stake × epoch_weight
    reward(deviate) = gain - P(caught) × slash
    
  Since P(caught) → 1 (on-chain transparency) and slash = φ³ × gain:
    reward(deviate) = gain - 1 × φ³ × gain = gain × (1 - φ³) < 0
    
  ∴ Honest behavior strictly dominates.
```

### LEX AEC-004 — Premium Justification Law
```
∀ NNC_sale:
  Price(NNC) = Price(raw_ICP_cycles) × φ²
  
  The premium is NOT a tax. It is compensation for:
    governance_value + ai_management + audit_trail + sovereign_independence
    
  If the market ever prices NNC below φ² × raw:
    Treasury intervenes by buying NNC (floor defense)
    Funded by: Treasury vault (#Vault tokens)
```

### LEX AEC-005 — Behavioral Invariant Law
```
∀ incentive_mechanism M:
  M.loss_aversion_parameter = φ²
  M.discount_rate = 1/φ
  M.diminishing_sensitivity = 1/φ
  
  These parameters are CONSTITUTIONAL — only changeable by
  supermajority (> 1/φ = 61.8% of voting power) governance vote.
```

---

## SECTION 6: SUB-CHARTER HIERARCHY

```
┌─────────────────────────────────────────────────────────────┐
│              ALPHA ECONOMICS CHARTER (AEC-2026)              │
│                    THIS DOCUMENT                              │
│         Supreme reference for all economic behavior          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐ ┌──────┐│
│  │ TC-AEC-2026 │ │ BE-AEC-2026 │ │ ME-AEC-2026  │ │TA-AEC││
│  │ Token       │ │ Behavioral  │ │ Managerial   │ │Token ││
│  │ Creation    │ │ Economics   │ │ Economics    │ │Analys││
│  └──────┬──────┘ └──────┬──────┘ └───────┬──────┘ └──┬───┘│
│         │               │                │            │     │
│         ▼               ▼                ▼            ▼     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │            IMPLEMENTATION LAYER                          ││
│  │  src/organisms/token_economics/main.mo                  ││
│  │  protocols/economics/*.js                               ││
│  │  sdk/economics/                                         ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## SECTION 7: INTEGRATION WITH EXISTING PROTOCOL

### 7.1 Token Economics ↔ nova_token
- All supply constants defined here are implemented in `nova_token/main.mo`
- The `getTokenEconomics()` function returns the parameters from Section 1
- Any change to supply architecture requires AEC amendment + code update

### 7.2 Behavioral Economics ↔ ssn_token
- SSN staking curves use the prospect theory parameters from Section 2
- Vesting periods follow the hyperbolic discount model
- Validator selection uses the herding mitigation formulas

### 7.3 Managerial Economics ↔ cycles_market
- Cycle pricing uses the marginal cost model from Section 3
- The φ² premium is justified by Section 3.5 analysis
- Make-vs-buy thresholds govern inter-canister call decisions

### 7.4 Market Microstructure ↔ auto_market / cycles_market
- The AMM invariant from Section 4.2 is the pricing engine
- Circuit breakers from Section 4.4 are enforced on-chain
- Price levels from Section 4.3 inform the DIVI organism's analytics

---

## SECTION 8: EVOLUTION PATH

```
v0.1.618: Charter ratification + token_economics canister (this release)
v1.1.618: Full behavioral engine integration with SSN staking
v2.1.618: Market microstructure AMM deployment
v3.1.618: Cross-protocol economic coordination (multi-subnet)
vφ.φ.φ:   Self-modifying economic parameters via governance
```

---

## APPENDIX A: MATHEMATICAL CONSTANTS

| Symbol | Value | Derivation |
|--------|-------|------------|
| φ | 1.6180339887498948482 | (1 + √5) / 2 |
| 1/φ | 0.6180339887498948482 | φ - 1 |
| φ² | 2.6180339887498948482 | φ + 1 |
| φ³ | 4.2360679774997896964 | φ² + φ |
| φ⁴ | 6.8541019662496845446 | φ³ + φ² |
| φ^13 | 521.001919... | Total supply exponent |
| Fib(13) | 233 | Validator minimum stake |

## APPENDIX B: FIBONACCI EPOCH TABLE

| Epoch | Duration (weeks) | Cumulative | Issuance Weight |
|-------|-----------------|------------|-----------------|
| 0 | 1 | 1 | φ^0 = 1.000 |
| 1 | 1 | 2 | φ^(-1) = 0.618 |
| 2 | 2 | 4 | φ^(-2) = 0.382 |
| 3 | 3 | 7 | φ^(-3) = 0.236 |
| 4 | 5 | 12 | φ^(-4) = 0.146 |
| 5 | 8 | 20 | φ^(-5) = 0.090 |
| 6 | 13 | 33 | φ^(-6) = 0.056 |
| 7 | 21 | 54 | φ^(-7) = 0.034 |
| 8 | 34 | 88 | φ^(-8) = 0.021 |
| 9 | 55 | 143 | φ^(-9) = 0.013 |
| 10 | 89 | 232 | φ^(-10) = 0.008 |
| 11 | 144 | 376 | φ^(-11) = 0.005 |
| 12 | 233 | 609 | φ^(-12) = 0.003 |

---

**Casa de Medina — Architectos de Architectura Inteligente**  
**AEC-2026-MEDINA — Ratified June 2026**
