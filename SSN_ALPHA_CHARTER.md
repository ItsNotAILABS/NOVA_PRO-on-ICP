# SSN ALPHA CHARTER — Sovereign Soulbound Identity Protocol

**Casa de Medina — Architectos de Architectura Inteligente**

**Official Designation: SSN-ALPHA-2026-MEDINA**  
**Charter Date: May 2026**  
**Classification: Alpha Protocol — Foundational Identity Layer**  
**Prior Art: May 2026**

---

> *This Charter is the supreme reference for the SSN identity system. It governs the
> soulbound token, all tradable sub-coins, and the φ-based staking curve mathematics.
> If any implementation diverges from this Charter, the implementation is wrong.*

---

## SECTION 1: WHAT THIS IS

### 1.1 The Alpha Identity Standard

The SSN (Sovereign Soulbound Number) is the **Alpha Protocol** — the foundational identity
layer upon which all other protocols, tokens, and governance mechanisms in the NATIVE NOVA
PROTOCOL are built.

**Why Alpha:**
- No protocol can function without identity
- No governance can exist without verified participants
- No economy can trade without trust anchors
- SSN is the root of all identity → SSN is Alpha

### 1.2 Core Architecture

```
┌─────────────────────────────────────────────────────┐
│                   SSN (Soulbound)                     │
│  Non-transferable │ 1 per identity │ Governance-only  │
│  revocation       │                │                  │
├─────────────────────────────────────────────────────┤
│  Fields:                                             │
│    id              : SSNId (global unique Nat)       │
│    owner_principal : Principal (Motoko)              │
│    reputation      : Float ∈ [0, 1] (from Julia)    │
│    stake_locked    : Nat (total across sub-coins)    │
│    epoch_joined    : Nat (first staking epoch)       │
│    flags           : {banned, probation, elevated}   │
└─────────────────────────────────────────────────────┘
         │
         │ mints / binds
         ▼
┌─────────────────────────────────────────────────────┐
│            SSN-X Sub-Coins (Tradable)                │
├─────────────────────────────────────────────────────┤
│  SSN-WORK   : Contribution / labor token            │
│  SSN-TRUST  : Reputation-backed credit token        │
│  SSN-GOV    : Governance weight token               │
├─────────────────────────────────────────────────────┤
│  Type: Fungible, ERC-20-like on Motoko              │
│  Issuance: Only by SSN contract                     │
│  Mint rate/caps: Computed by Julia                   │
│  Transfer: Fully tradable between principals         │
│  Binding: Always associated with root SSN id        │
│  Burn effect: Increases SSN reputation              │
└─────────────────────────────────────────────────────┘
```

---

## SECTION 2: IMMUTABLE LAWS

### LEX SSN-ALPHA-001 — Soulbound Invariant
```
∀ ssn ∈ SSNRegistry:
  ssn.transferable = false
  ssn.revocable_by = GovernanceOrgan ONLY
  ssn.supply_per_identity = 1
```

**No SSN may ever be transferred, duplicated, or self-revoked.**

### LEX SSN-ALPHA-002 — Sub-Coin Binding Invariant
```
∀ balance ∈ SubCoinBalances:
  ∃ ssn ∈ SSNRegistry: balance.ssnId = ssn.id
  
  // Every sub-coin balance MUST trace to a living SSN
  // If SSN is revoked (banned), sub-coins are frozen
```

### LEX SSN-ALPHA-003 — Mint Authority Invariant
```
∀ mint_event ∈ SubCoinMints:
  mint_event.caller = SSN_CONTRACT
  mint_event.amount ≤ Julia.computeMintCap(ssn.stake, ssn.reputation)
```

**No entity other than the SSN contract may mint sub-coins.**

### LEX SSN-ALPHA-004 — Reputation Sovereignty
```
∀ reputation_update:
  reputation_update.source = JuliaBridge
  reputation_update.value ∈ [0.0, 1.0]
  reputation_update.monotonic = false  // can increase or decrease
```

**Reputation is computed exclusively by the Julia engine, not by Motoko logic.**

---

## SECTION 3: φ-BASED STAKING CURVE MATHEMATICS

### 3.1 Constants

```
φ = (1 + √5) / 2 ≈ 1.6180339887   — Golden Ratio
k = global reward scale              — tunable by governance
T = characteristic epoch scale        — loyalty time constant
```

### 3.2 Base Reward Curve

```
R_base(s) = k × s^(1/φ)

Where:
  s = stake amount (base units)
  1/φ ≈ 0.618 — sub-linear exponent

Property: Diminishing returns prevent whale domination.
  - Doubling stake gives only 2^0.618 ≈ 1.534× more reward
  - 10× stake gives only 10^0.618 ≈ 4.15× more reward
```

### 3.3 Reputation Multiplier

```
M_r(r) = (1 + r)^(1/φ)

Where:
  r = reputation score ∈ [0, 1]

Properties:
  - r = 0 (new identity):   M_r = 1.0^0.618 = 1.000
  - r = 0.5 (established):  M_r = 1.5^0.618 ≈ 1.282
  - r = 1.0 (maximum):      M_r = 2.0^0.618 ≈ 1.534

Long-term aligned identities earn up to 53.4% more.
```

### 3.4 Time-Loyalty Multiplier

```
M_t(t) = 1 + (1 - e^(-t / (φ × T)))

Where:
  t = epochs staked (continuous)
  T = characteristic epoch scale

Properties:
  - t = 0:          M_t = 1.000 (no bonus)
  - t = φT:         M_t = 1 + (1 - e^(-1)) ≈ 1.632
  - t = 2φT:        M_t = 1 + (1 - e^(-2)) ≈ 1.865
  - t → ∞:          M_t → 2.000 (asymptotic maximum)

Loyal stakers approach 2× multiplier over long time.
```

### 3.5 Full Reward Function

```
R(s, r, t) = R_base(s) × M_r(r) × M_t(t)
           = k × s^(1/φ) × (1+r)^(1/φ) × [1 + (1 - e^(-t/(φT)))]
```

**Maximum theoretical multiplier:** 1.534 × 2.0 = 3.068×  
(Maximum reputation + maximum time loyalty vs. bare stake)

### 3.6 Julia Computation Responsibilities

The Julia engine computes per epoch:
1. `R` — reward amount for each staking SSN
2. Updated `r` — reputation score based on on-chain behavior
3. Suggested caps for SSN-X minting based on `(stake, reputation, epoch_age)`
4. Risk scores for governance alerting

---

## SECTION 4: TRADABLE SUB-COINS (SSN-X)

### 4.1 Sub-Coin Types

| Symbol     | Name                          | Transferable | Exportable | Mint Cap Source         |
|------------|-------------------------------|:------------:|:----------:|------------------------|
| SSN-WORK   | Contribution / Labor Token    | ✓            | ✓          | Julia(stake, rep, age) |
| SSN-TRUST  | Reputation-Backed Credit      | ✓            | ✓          | Julia(stake, rep)      |
| SSN-GOV    | Governance Weight Token       | ✓            | ✗          | Julia(stake, rep, age) |

### 4.2 Mint Constraints

```
MintCap_WORK(ssn)  = floor(ssn.stakeLocked^(1/φ) × ssn.reputation × 1_000_000)
MintCap_TRUST(ssn) = floor(ssn.stakeLocked^(1/φ) × ssn.reputation × 500_000)
MintCap_GOV(ssn)   = floor(ssn.stakeLocked^(1/φ) × ssn.reputation × 100_000)
```

Caps are per-epoch. Unused cap does NOT roll over.

### 4.3 Burn Effects

| Action                  | Effect                                    |
|-------------------------|-------------------------------------------|
| Burn SSN-WORK           | +0.001 reputation per unit burned         |
| Burn SSN-TRUST          | +0.005 reputation per unit burned         |
| Burn SSN-GOV            | +0.010 reputation per unit burned         |
| Reputation overflow     | Capped at 1.0                             |

### 4.4 Transfer Rules

- Transfers are between principals (any principal holding sub-coins)
- Every balance record tracks the originating `ssnId`
- If source SSN is banned: **all associated sub-coin transfers freeze**
- Transfer fee: 0 (no fee on sub-coin transfers within organism)
- Non-exportable coins (SSN-GOV) cannot leave the organism boundary

---

## SECTION 5: GOVERNANCE

### 5.1 SSN Lifecycle

```
  UNREGISTERED → ACTIVE → [PROBATION] → BANNED
                    ↕           ↑
                 ELEVATED ──────┘ (governance can restore)
```

### 5.2 Flag Effects

| Flag       | Effect                                                |
|------------|-------------------------------------------------------|
| `banned`   | All operations frozen. Sub-coins frozen. No rewards.  |
| `probation`| Reduced mint caps (÷φ). Transfers monitored.          |
| `elevated` | Increased mint caps (×φ). Can propose governance.     |

### 5.3 Revocation Process

1. Governance organ submits revocation proposal
2. Attestation vote: quorum 30%, approval ≥ 66%
3. If passed: SSN flags set to `{banned: true}`
4. All sub-coin balances bound to that SSN are frozen
5. Frozen balances can be redistributed by governance after F(11) = 89 epochs

---

## SECTION 6: GOVERNED ORGANISMS

| Organism       | Role                                              |
|----------------|---------------------------------------------------|
| `ssn_token`    | Primary SSN contract. Manages registry + staking  |
| `nova_token`   | NOVA governance token. Accepts SSN-GOV for voting |
| `sovereign`    | Governance organ. Can revoke SSN via proposal     |
| `oracle`       | Julia bridge. Feeds reputation + mint cap data    |
| `veritex`      | Attestation. Records SSN creation + revocation    |
| `effecttrace`  | Audit. Logs all SSN state changes                 |

---

## SECTION 7: FRAMEWORK CERTIFICATIONS

- **NEXUS-IDENTITY** — SSN is the canonical identity primitive
- **RSHIP-CORE** — Satisfies Permanence (soulbound) + Trust (reputation-backed)
- **SBC-2026** — All SSN state changes are Pythagorean-finality proven
- **GPC-2026** — SSN-GOV integrates with governance proposal system

---

## SECTION 8: EVOLUTION PATH

| Version    | Milestone                                                  |
|------------|------------------------------------------------------------|
| v0.1.618   | Core SSN registry, sub-coin minting, φ-staking curves     |
| v1.1.618   | Julia-computed dynamic mint caps, cross-organism attestation|
| v2.1.618   | Multi-organism SSN federation, inter-protocol SSN sharing  |
| v3.1.618   | zk-proof SSN verification, privacy-preserving reputation   |

---

## SECTION 9: IMPLEMENTATION REFERENCE

**Motoko Canister:** `src/organisms/ssn_token/main.mo`  
**Julia Engine:** `engines/julia/NumericalBridge.jl` (staking curve computations)  
**Nova Manifest:** `nova.json` → `ssn_token` entry  

---

## CLOSING DECLARATION

This Charter establishes the SSN system as the **Alpha Protocol** of the NATIVE NOVA
PROTOCOL. All identity, all governance weight, all economic participation, all reputation
— all trace back to an SSN. Without an SSN, a principal is nothing. With an SSN, a
principal is everything.

The Charter is Alpha. The Alpha is sovereign.

**φ governs the mathematics. The mathematics governs the protocol. The protocol governs identity.**

---

*Filed under: PROTOCOL_CHARTERS → SSN-ALPHA-2026-MEDINA*  
*Canister: ssn_token (74th organism)*  
*Status: ACTIVE*
