# BEHAVIORAL ECONOMICS SUB-CHARTER (BE-AEC-2026)

**Casa de Medina — Architectos de Architectura Inteligente**

**Official Designation: BE-AEC-2026-MEDINA**  
**Parent Charter: AEC-2026-MEDINA (Alpha Economics Charter)**  
**Classification: Sub-Charter — Behavioral Economics & Incentive Design**  
**Prior Art: June 2026**

---

> *This Sub-Charter governs all behavioral economic mechanisms in the Native Nova Protocol.
> It defines how human psychology and AI agent behavior are modeled, incentivized, and
> guided toward protocol-optimal outcomes.*

---

## SECTION 1: PROSPECT THEORY PARAMETERS

### 1.1 The NOVA Value Function

Agents evaluate gains and losses relative to a reference point (their current stake):

```
v(x) = {
  x^α                    if x ≥ 0  (gains domain)
  -λ × (-x)^β           if x < 0  (losses domain)
}

NOVA Canonical Parameters:
  α = 1/φ = 0.6180339887    (gain sensitivity — concave, diminishing)
  β = 1/φ = 0.6180339887    (loss sensitivity — convex, diminishing)
  λ = φ²  = 2.6180339887    (loss aversion coefficient)
```

### 1.2 Decision Weights (Probability Weighting)

Agents overweight small probabilities and underweight large ones:

```
π(p) = p^γ / (p^γ + (1-p)^γ)^(1/γ)

NOVA Parameter:
  γ = 1/φ = 0.618

Effect on protocol design:
  - Agents OVERWEIGHT the probability of being slashed (small p, large perceived p)
  - This makes slashing more effective than its mathematical expectation suggests
  - Staking insurance (if offered) would be overvalued → design opportunity
```

### 1.3 Reference Point Dynamics

```
Reference Point = Current_Stake + φ × Average_Epoch_Reward

Agents evaluate future states relative to their "expected trajectory":
  - Receiving the average reward feels neutral (neither gain nor loss)
  - Receiving less than average feels like a LOSS (triggers loss aversion)
  - Receiving more than average feels like a gain (diminishing returns)

Design Implication:
  - Reward variability should be bounded: σ(reward) < 1/φ × mean(reward)
  - This keeps most outcomes in the "gains" domain
  - Occasional large rewards (> φ × mean) create positive surprises
```

---

## SECTION 2: HYPERBOLIC DISCOUNTING FOR VESTING

### 2.1 The Discount Function

Agents value future rewards using hyperbolic (not exponential) discounting:

```
D(t) = 1 / (1 + k × t)

NOVA Parameter:
  k = 1/φ = 0.618 (φ-calibrated impatience factor)

Comparison with exponential discounting:
  Exponential: D(t) = δ^t — implies time consistency
  Hyperbolic:  D(t) = 1/(1+kt) — implies present bias (preference reversals)

NOVA uses hyperbolic because:
  1. Empirically more accurate for human agents
  2. Creates predictable "impatience zones" we can exploit
  3. Fibonacci periods align with natural discount breakpoints
```

### 2.2 Vesting Period Design

```
Fibonacci Dissolve Periods: [1, 1, 2, 3, 5, 8, 13, 21] weeks

Perceived Value at Each Lockup:
  Week 1:  V × 1/(1 + 0.618×1)  = V × 0.618 = 61.8% perceived
  Week 2:  V × 1/(1 + 0.618×2)  = V × 0.447 = 44.7% perceived
  Week 3:  V × 1/(1 + 0.618×3)  = V × 0.350 = 35.0% perceived
  Week 5:  V × 1/(1 + 0.618×5)  = V × 0.244 = 24.4% perceived
  Week 8:  V × 1/(1 + 0.618×8)  = V × 0.168 = 16.8% perceived
  Week 13: V × 1/(1 + 0.618×13) = V × 0.110 = 11.0% perceived
  Week 21: V × 1/(1 + 0.618×21) = V × 0.071 = 7.1% perceived

Reward Compensation (to maintain participation):
  APY(period_n) = base_apy × φ^(n/φ)
  
  Week 1:  base × φ^0.618 = base × 1.414
  Week 5:  base × φ^3.090 = base × 5.472
  Week 13: base × φ^8.034 = base × 54.67
  Week 21: base × φ^12.97 = base × 517.8

  Long lockups require exponentially higher rewards to offset hyperbolic discount.
```

### 2.3 Present Bias Exploitation (Ethical)

```
Commitment Devices:
  1. Auto-restake: Default = compound rewards into same lockup
  2. Cooling-off: After unlock, 1/φ epoch delay before withdrawal
  3. Escalation: Each consecutive lockup earns φ× the previous multiplier
  4. Social lock: Public commitment of lock duration (SSN-linked)

These exploit present bias FOR the agent:
  - Present-biased agents undervalue future rewards
  - Commitment devices lock them into behavior they'd rationally choose
  - Net effect: higher returns than they'd achieve without commitment
```

---

## SECTION 3: ANCHORING EFFECTS IN GOVERNANCE

### 3.1 First-Mover Anchoring

```
Problem:
  The first vote on a governance proposal creates an anchor.
  Subsequent voters are biased toward the anchor.

Model:
  vote_i = anchor × φ_weight + independent_assessment × (1 - φ_weight)
  Where φ_weight ≈ 1/φ ≈ 0.618 (empirical anchoring strength)

Mitigation Mechanisms:
  1. Commit-Reveal:
     - Phase 1: Submit encrypted vote hash (commit)
     - Phase 2: Reveal votes after deadline (reveal)
     - Duration: 1/φ × epoch_duration per phase
     
  2. Sequential Revelation:
     - Votes revealed in random order (not chronological)
     - Prevents "following the leader" cascades
     
  3. Anchor Dilution:
     - Early votes (first 1/φ³ of voting period) weighted at 1/φ
     - Late votes (last 1/φ of voting period) weighted at φ
     - This rewards independent thinking (late voters had time to analyze)
```

### 3.2 Proposal Framing

```
Anchoring in proposal text:
  - Numeric anchors in descriptions bias voting thresholds
  
Rules for proposal authors:
  1. Budget proposals MUST show φ-range: [requested/φ, requested×φ]
  2. Parameter changes MUST show current value AND φ-deviation bounds
  3. No absolute numbers in titles (use relative: "increase by 1/φ²" not "add 382 NOVA")
```

---

## SECTION 4: ENDOWMENT EFFECT ON SOULBOUND TOKENS

### 4.1 The SSN Endowment Amplifier

```
Standard endowment effect: WTA/WTP ratio ≈ 2:1 (people demand 2× to sell vs buy)

SSN Amplification:
  Because SSN is non-transferable:
    WTA = ∞ (cannot sell at any price)
    WTP = identity_value (what would you pay to get one?)
    
  Effective endowment multiplier = φ³ ≈ 4.236
  
  This means:
    - Threatening SSN revocation is 4.236× more powerful than threatening equivalent fine
    - SSN holders value their identity token at φ³× its "objective" governance value
    - Loss of SSN creates disproportionate psychological pain
```

### 4.2 Leveraging Endowment for Protocol Compliance

```
Governance Compliance Hierarchy (by deterrence power):
  1. SSN revocation threat:     deterrence = penalty × φ³ × λ = penalty × 4.236 × 2.618
                                           = penalty × 11.09
  2. Stake slashing:            deterrence = penalty × λ = penalty × 2.618
  3. Reputation reduction:       deterrence = penalty × φ = penalty × 1.618
  4. Monetary fine:             deterrence = penalty × 1.0 (baseline)

Design Principle:
  Use SSN threats sparingly (only for severe violations)
  Use stake slashing for moderate violations
  Use reputation for minor violations
  Reserve monetary fines for routine matters (fees, etc.)
```

### 4.3 Identity-Stake Coupling

```
SSN reputation feeds back into staking economics:
  effective_stake(i) = raw_stake(i) × reputation(i)^φ
  
  Where reputation ∈ [0, 1] (computed by Julia reputation engine)
  
  At reputation = 1.0: effective = raw (full participation)
  At reputation = 1/φ: effective = raw × 0.618^φ = raw × 0.523
  At reputation = 1/φ²: effective = raw × 0.382^φ = raw × 0.299
  
  Low-reputation actors automatically earn less even with high stake.
  This creates a "soft exclusion" that's economically rational for honest agents.
```

---

## SECTION 5: HERDING AND SOCIAL PROOF

### 5.1 Validator Selection Herding

```
Observed herding function:
  P(choose_validator_i) = stake_i^φ / Σ(stake_j^φ, j=1..N)

Because φ > 1, this is SUPERLINEAR:
  - Validators with 2× stake get 2^φ ≈ 3.07× more delegation
  - Validators with φ× stake get φ^φ ≈ 2.39× more delegation
  - This creates "winner takes most" dynamics → centralization risk

Anti-herding mechanisms:
  1. Diminishing returns on large validators:
     reward_per_stake(i) = R × stake_i^(1/φ - 1) × total_stake
     = R × stake_i^(-0.382) × total_stake
     (Larger validators earn LESS per unit staked)
     
  2. φ-cap on concentration:
     max_share = 1/φ² ≈ 38.2% of total delegation
     If stake_i > 0.382 × total: excess delegation redirected to smallest φ validators
     
  3. Diversity bonus:
     bonus(i) = base_reward × φ^(-rank_i)
     (Selecting a lower-ranked validator earns extra)
     
  4. Information provision:
     Display "effective APY" (including diversity bonus) prominently
     Display concentration risk warnings when selecting top validators
```

### 5.2 Social Proof in Governance Participation

```
Participation nudges based on social proof:
  1. "φ% of your peer group voted this epoch" (peer = same epoch_joined cohort)
  2. "Validators with similar stake earned X more by voting" (loss framing)
  3. "Your governance participation is in the top/bottom φ percentile"

Social proof multiplier on governance rewards:
  If participation_rate > 1/φ: reward × φ (reward early adopters)
  If participation_rate > 1/φ²: reward × 1 (baseline)
  If participation_rate < 1/φ²: reward × 1/φ (penalize apathy)
```

---

## SECTION 6: NUDGE ARCHITECTURE

### 6.1 Default Settings (Opt-Out Design)

```
New SSN holders receive these DEFAULTS:
  - Auto-stake: 1/φ³ ≈ 23.6% of received tokens → #Gov (opt-out available)
  - Auto-compound: Governance rewards re-locked (opt-out available)
  - Vote delegation: Delegated to highest-reputation validator (opt-out available)
  - Notifications: Epoch transition alerts ON (opt-out available)

Justification (libertarian paternalism):
  - Defaults chosen to maximize long-term holder welfare
  - All defaults are reversible with zero cost
  - Agents who actively choose are unaffected
  - Present-biased agents benefit from defaults they'd rationally choose
```

### 6.2 Framing Effects

```
Loss Framing (for unstaking):
  ❌ "Unstake 100 NOVA" 
  ✓ "You will lose 2.618 NOVA/week in voting rewards"
  
Gain Framing (for staking):
  ❌ "Stake 100 NOVA for 13 weeks"
  ✓ "Earn φ× your current rewards (54.67× base APY at 13-week lock)"

Social Framing:
  ❌ "23% of holders participate in governance"
  ✓ "77% of holders are missing out on governance rewards"

Temporal Framing:
  ❌ "Dissolve delay: 13 weeks"
  ✓ "Unlock in just 2 Fibonacci epochs"
```

### 6.3 Choice Architecture

```
Staking Options Presentation:
  - Present 3 options (not 8): Short (1w), Medium (5w), Long (13w)
  - Highlight Medium as "most popular" (social proof + anchoring)
  - Show comparison table with φ-framed APY differences
  - Pre-select Medium (default effect)

Governance Voting:
  - Show proposals in randomized order (prevent position bias)
  - Highlight "time remaining" prominently (scarcity/urgency nudge)
  - Show "your voting power if you vote: X" (endowment preview)
  - After voting: celebrate with reputation increase notification
```

### 6.4 Feedback Loops

```
Positive Reinforcement Schedule:
  - Variable ratio: Reward notifications at Fibonacci intervals
  - Not every reward gets a notification (prevents habituation)
  - Streak bonuses: consecutive epoch participation earns φ^streak bonus
  
Negative Feedback:
  - Reputation decay: visible decline notification (loss aversion trigger)
  - "Your rank dropped by N positions" (social comparison + loss)
  - Approaching slash threshold warning (prevention focus)
```

---

## SECTION 7: AI AGENT BEHAVIORAL PARAMETERS

### 7.1 AI Agents as Economic Actors

```
AI organisms (DIVI, brain, cordex, etc.) are ALSO economic agents.
They don't have human biases but must interact with humans who DO.

AI Agent Design Rules:
  1. AI agents assume humans have biases (use this charter's parameters)
  2. AI agents themselves use expected-value maximization (no prospect theory)
  3. AI recommendations to humans are framed using nudge architecture
  4. AI market-making uses rational pricing (no anchoring)
  5. AI governance participation uses game-theoretic optimal strategies
```

### 7.2 Human-AI Interaction Economics

```
When AI recommends to human:
  Frame recommendations using prospect theory parameters
  Example (DIVI recommending stake amount):
    "Based on your profile, staking X NOVA for Fib(5) weeks
     maximizes your risk-adjusted return.
     Risk: losing X in a slash event feels like losing 2.618X.
     Reward: earning Y per epoch (compound Y×13 over full period).
     Net perceived value: positive at confidence > 1/φ²."
```

---

## APPENDIX: BEHAVIORAL PARAMETER REGISTRY

| Parameter | Symbol | Value | Source |
|-----------|--------|-------|--------|
| Loss aversion | λ | φ² = 2.618 | Kahneman & Tversky (calibrated to φ) |
| Gain sensitivity | α | 1/φ = 0.618 | Prospect theory (φ-aligned) |
| Loss sensitivity | β | 1/φ = 0.618 | Prospect theory (φ-aligned) |
| Probability weight | γ | 1/φ = 0.618 | Prelec (φ-aligned) |
| Discount rate | k | 1/φ = 0.618 | Hyperbolic model (φ-aligned) |
| Anchoring strength | w | 1/φ = 0.618 | Empirical (Tversky & Kahneman) |
| Endowment multiplier | ε | φ³ = 4.236 | Soulbound amplification |
| Herding exponent | h | φ = 1.618 | Superlinear preference |
| Default opt-in rate | d | 1/φ³ = 0.236 | Auto-stake percentage |
| Social proof threshold | s | 1/φ = 0.618 | Participation trigger |

---

**Casa de Medina — Architectos de Architectura Inteligente**  
**BE-AEC-2026-MEDINA — Ratified June 2026**
