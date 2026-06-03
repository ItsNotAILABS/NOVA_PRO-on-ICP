# TOKEN CREATION SUB-CHARTER (TC-AEC-2026)

**Casa de Medina — Architectos de Architectura Inteligente**

**Official Designation: TC-AEC-2026-MEDINA**  
**Parent Charter: AEC-2026-MEDINA (Alpha Economics Charter)**  
**Classification: Sub-Charter — Token Creation & Supply Mechanics**  
**Prior Art: June 2026**

---

> *This Sub-Charter governs all token minting, burning, supply enforcement, and
> issuance scheduling within the Native Nova Protocol. It is subordinate to
> the Alpha Economics Charter (AEC-2026).*

---

## SECTION 1: MINT TRIGGERS AND CONDITIONS

### 1.1 Authorized Minting Sources

Only the following canister functions may increase token supply:

| Source | Canister | Function | Conditions |
|--------|----------|----------|------------|
| Genesis mint | nova_token | `initialize()` | Once only, sets initial distribution |
| Governance reward | nova_token | `mint()` | Called by epoch scheduler |
| SNS swap | sns_dao | (via governance) | Community allocation only |
| Ecosystem grant | nova_token | `mint()` | Requires SNS proposal approval |

### 1.2 Mint Authorization Protocol

```
PRE-CONDITIONS for any mint():
  1. caller ∈ {admin_principal, sns_governance_canister}
  2. amount + current_supply ≤ TOTAL_SUPPLY_E8S
  3. role ∈ {#Gov, #Cycle, #Vault, #Free}
  4. recipient ≠ burn_address (0x000...000)
  5. epoch_budget(current_epoch) ≥ amount

POST-CONDITIONS:
  1. total_supply increased by exactly `amount`
  2. recipient.balance[role] increased by exactly `amount`
  3. Transaction logged with kind = #Mint
  4. Audit log entry created
  5. epoch_remaining_budget decreased by `amount`
```

### 1.3 Anti-Inflation Guards

```
INVARIANT: total_supply(t) ≤ 52_100_196_600 e8s ∀ t

Hard cap enforcement:
  func mint(to, amount, role):
    assert(current_supply + amount ≤ TOTAL_SUPPLY_E8S)
    // Violation → trap (canister-level abort, no state change)

Epoch budget enforcement:
  func epochBudget(n : Nat) : Nat:
    // Each epoch can mint at most its φ-weighted share
    return (TOTAL_SUPPLY_E8S * PHI_INV_POW[n]) / NORMALIZATION_SUM
    
  Where PHI_INV_POW[n] = (1/φ)^n
  And NORMALIZATION_SUM = Σ((1/φ)^k, k=0..12) ≈ 2.618
```

---

## SECTION 2: SUPPLY CAP ENFORCEMENT MATHEMATICS

### 2.1 The φ^13 Supply Derivation

```
Why φ^13:
  φ^1  = 1.618...
  φ^2  = 2.618...
  φ^3  = 4.236...
  φ^5  = 11.090...
  φ^8  = 46.979...
  φ^13 = 521.002... ← Our supply number (in whole NOVA)

Properties:
  - φ^13 = φ^8 × φ^5 (Fibonacci addition: 13 = 8 + 5)
  - φ^13 ≈ Fibonacci(14) - 1/φ^13 = 610 - 0.00192 ≈ 521 (close to Fib(14)/φ)
  - In e8s: 521.001966 × 10^8 = 52,100,196,600

Supply arithmetic:
  TOTAL = 52_100_196_600 e8s (fixed, immutable, deployed in genesis)
  
  TREASURY = floor(TOTAL × 1/φ²) = floor(TOTAL × 0.38196...) = 19_918_285_500
  COMMUNITY = floor(TOTAL × 1/φ³) = floor(TOTAL × 0.23607...) = 12_297_756_900
  FOUNDER = TOTAL - TREASURY - COMMUNITY = 19_884_154_200
  
  Verification: 19_918_285_500 + 12_297_756_900 + 19_884_154_200 = 52_100_196_600 ✓
```

### 2.2 Precision Guarantees

```
All supply math uses Nat (arbitrary-precision natural numbers):
  - No floating-point rounding in supply calculations
  - Division uses floor() for deterministic results
  - Remainder tracking: residual = TOTAL - Σ(allocations) → added to treasury

Cross-canister supply verification:
  func verifySupply() : Bool:
    let sum = Σ(account.free + account.gov + account.cycle + account.vault) for all accounts
    let burned = totalBurned
    return sum + burned == TOTAL_SUPPLY_E8S
    
  This MUST be true at all times. Any divergence → critical alert.
```

---

## SECTION 3: DEFLATIONARY BURN MECHANICS

### 3.1 Burn Sources

| Source | Amount | Trigger | Frequency |
|--------|--------|---------|-----------|
| Transfer fee | 10,000 e8s | Every ICRC-1 transfer | Per transaction |
| Cycle redemption | Full amount redeemed | NNC unwrap to raw cycles | On demand |
| Governance slash | φ³ × violation_stake | Invalid validation proven | Event-driven |
| Voluntary burn | User-specified | `burn(from, amount)` call | On demand |
| Epoch decay | φ^(-epoch) × unclaimed | Unclaimed rewards after epoch | Per epoch |

### 3.2 Burn Mechanics

```
func burn(from : Text, amount : Nat) : TransferResult:
  PRE:
    - accounts[from].free ≥ amount
    - amount > 0
    
  EFFECT:
    - accounts[from].free -= amount
    - totalBurned += amount
    - No recipient (tokens destroyed permanently)
    - Transaction recorded: kind = #Burn, to = "0x0...0"
    
  POST:
    - circulating_supply decreased by amount
    - total_supply unchanged (totalBurned is accounting, not removal from ledger)
    - Effective supply = TOTAL_SUPPLY_E8S - totalBurned
```

### 3.3 Deflation Modeling

```
Expected daily burn rate:
  B(t) = tx_volume(t) × 10_000 + redemptions(t) + slashes(t)

At target tx volume of 10,000 txs/day:
  B = 10_000 × 10_000 = 100_000_000 e8s/day = 1 NOVA/day

At 100,000 txs/day:
  B = 100_000 × 10_000 = 1_000_000_000 e8s/day = 10 NOVA/day

Supply half-life (at 100K txs/day, no new minting):
  t_half = TOTAL_SUPPLY / (2 × daily_burn) = 52.1B / (2 × 1B) ≈ 26 days
  
  But issuance partially offsets: net_burn = B(t) - I(epoch)
  Steady-state: supply converges when I(epoch) = B(t)
```

---

## SECTION 4: FIBONACCI EPOCH ISSUANCE SCHEDULES

### 4.1 Epoch Definition

```
Epoch = a governance-defined time period for economic scheduling.

Epoch Sequence (Fibonacci): [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]
Base Duration: 7 days per unit
Total Cycle: Σ(Fibonacci_epochs) × 7 = 609 × 7 = 4,263 days ≈ 11.7 years

After the 13th epoch completes:
  - Protocol enters "steady state"
  - No new scheduled issuance
  - Only governance-approved minting from remaining budget
  - Deflation dominates
```

### 4.2 Per-Epoch Issuance Budget

```
Budget(n) = COMMUNITY_E8S × weight(n) / Σ(weights)

Where:
  weight(n) = φ^(-n)  (geometrically decreasing)
  Σ(weights) = Σ(φ^(-k), k=0..12) = (1 - φ^(-13)) / (1 - 1/φ) ≈ 2.618

Budget Table:
  Epoch 0:  12_297_756_900 × 1.000 / 2.618 = 4,698,150,840 e8s (≈46.98 NOVA)
  Epoch 1:  12_297_756_900 × 0.618 / 2.618 = 2,903,797,319 e8s (≈29.04 NOVA)
  Epoch 2:  12_297_756_900 × 0.382 / 2.618 = 1,794,353,521 e8s (≈17.94 NOVA)
  Epoch 3:  12_297_756_900 × 0.236 / 2.618 = 1,109,443,798 e8s (≈11.09 NOVA)
  ...
  Epoch 12: 12_297_756_900 × 0.003 / 2.618 =    14,098,372 e8s (≈0.14 NOVA)
```

### 4.3 Issuance Distribution Within Epoch

```
Within each epoch, the budget is distributed as:
  - Governance rewards:    1/φ  ≈ 61.8% of epoch budget
  - Staking rewards:       1/φ² ≈ 38.2% of epoch budget
  
  Governance rewards go to: active voters (proportional to voting power)
  Staking rewards go to: validators (proportional to stake × uptime)

Unclaimed rewards after epoch end:
  - Wait period: 1/φ of next epoch's duration
  - If still unclaimed: burned (Section 3.1, "Epoch decay")
  - This prevents dead-weight accumulation
```

---

## SECTION 5: ROLE-TAG MINTING RULES

### 5.1 Role Assignment at Mint

```
Every mint operation MUST specify a role tag:

  mint(to, amount, #Gov)   — Governance-locked from birth
  mint(to, amount, #Cycle) — Compute-access from birth  
  mint(to, amount, #Vault) — Treasury-reserved from birth
  mint(to, amount, #Free)  — Liquid from birth

Role at mint is PERMANENT for the minted batch.
Role transitions require explicit lock/unlock operations.
```

### 5.2 Role Transition Rules

```
Allowed transitions:
  #Free → #Gov    via lock()   [dissolve delay = Fib(epoch_index) weeks]
  #Free → #Cycle  via lock()   [immediate, no delay]
  #Gov  → #Free   via unlock() [after dissolve delay expires]
  #Cycle → BURN   via redeem() [exchanged for NNC, NOVA destroyed]
  #Vault → #Free  via unlock() [emergency: requires >61.8% governance vote]

Forbidden transitions:
  #Gov → #Cycle   (must unlock to #Free first)
  #Vault → #Gov   (must unlock to #Free first)
  #Cycle → #Gov   (must burn and re-earn)
  Any → #Vault    (only treasury operations can create #Vault)
```

### 5.3 Role Economics

```
#Gov Economics:
  - Earns: voting_power = amount × φ^(lock_duration / base_dissolve)
  - Earns: epoch_rewards = governance_budget × (my_voting_power / total_voting_power)
  - Costs: illiquidity for Fibonacci dissolve period

#Cycle Economics:
  - Earns: compute access (1 NNC per NOVA/φ² ratio)
  - Costs: permanent destruction (burned on redemption)
  - Break-even: if compute_value > φ² × NOVA_price, profitable

#Vault Economics:
  - Earns: nothing directly (but backs floor price for all holders)
  - Purpose: system-level stability guarantee
  - Access: only under extreme governance-approved conditions

#Free Economics:
  - Earns: transfer utility, market trading
  - Costs: 10,000 e8s per transfer (deflationary)
  - Optimal: hold as #Free only if immediate liquidity needed
```

---

## APPENDIX: IMPLEMENTATION REFERENCE

```
Canister: nova_token (src/organisms/nova_token/main.mo)
Functions:
  initialize()           — Genesis mint (idempotent)
  mint(to, amount, role) — Authorized minting
  burn(from, amount)     — Permanent supply reduction
  transfer(from, to, amount, role) — Move between accounts
  lock(from, amount, target_role)  — Free → Gov/Cycle
  unlock(from, amount)             — Gov → Free (after delay)
  
Query:
  balanceOf(principal)     — Per-role balances
  getSupplySnapshot()      — Global supply metrics
  getTokenEconomics()      — Full parameter export
  verifySupply()           — Integrity check
```

---

**Casa de Medina — Architectos de Architectura Inteligente**  
**TC-AEC-2026-MEDINA — Ratified June 2026**
