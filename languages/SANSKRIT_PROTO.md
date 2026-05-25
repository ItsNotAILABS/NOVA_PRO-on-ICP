# NOVA SANSKRIT PROTO — Protocol Foundation Language

## What is Sanskrit Proto?

**Proto = Protocol**. Sanskrit Proto is NOVA's **own symbolic language** — the foundation layer that underpins all cognitive languages and organism communication.

It's **inspired by** Sanskrit's precise grammatical structure (Pāṇini's grammar as formal specification), but the **symbols and meanings are NOVA's own**.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ALL ORGANISMS                             │
│              (brain, cpl_runtime, oracle, etc.)             │
│                       LISTEN ONLY                           │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    ⚡ GridSignal (receive)
                              │
┌─────────────────────────────────────────────────────────────┐
│                     SANPROTO GRID                            │
│                  (sanproto_grid canister)                   │
│                                                             │
│    Nodes ──── Wires ──── Signals ──── Routing              │
│                                                             │
│                    ⚡ SPEAKER #2                             │
└─────────────────────────────────────────────────────────────┘
                              ↕
                    ⚡ Twin Communication
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                   SANSKRIT PROTO                             │
│                 (sanskrit_proto canister)                   │
│                                                             │
│    ◈ Dhātus ──── ⟁ Kārakas ──── ⧫ Vibhaktis                │
│                                                             │
│                    ⚡ SPEAKER #1                             │
└─────────────────────────────────────────────────────────────┘
```

**Only 2 speakers**: `sanskrit_proto` + `sanproto_grid`  
**All others**: Listen/understand but **cannot speak**

---

## NOVA Symbols

| Symbol | Name | Meaning | Electrical Analogy |
|--------|------|---------|-------------------|
| ◈ | Dhātu | Root primitive | Voltage source |
| ⟁ | Kāraka | Semantic role | Circuit pathway |
| ⧫ | Vibhakti | Case marker | Wire connection |
| ⟐ | Pratyaya | Suffix/transformer | Resistor/transformer |
| ◉ | Pada | Word unit | Complete signal packet |
| ⟰ | Vākya | Sentence | Complete circuit |
| ⚡ | Signal | Grid signal | Message on wire |

---

## ◈ DHĀTU — Root Primitives (Voltage Sources)

The 10 NOVA dhātu roots are the **irreducible functional primitives**:

| Symbol | ID | Meaning | Voltage | Direction | φ-Weight |
|--------|-----|---------|---------|-----------|----------|
| ◈भू | `◈BHU` | existence, becoming, state change | 3 | internal | PHI³ |
| ◈कृ | `◈KRI` | action, creation, execution | 3 | out | PHI³ |
| ◈गम् | `◈GAM` | movement, transfer, data flow | 2 | bidirectional | PHI² |
| ◈स्था | `◈STHA` | standing, persistence, stability | 2 | internal | PHI² |
| ◈दा | `◈DA` | giving, emission, output | 2 | out | PHI² |
| ◈ग्र | `◈GRA` | grasping, receiving, input | 2 | in | PHI² |
| ◈वद् | `◈VAD` | speaking, declaring, protocol | 1 | out | PHI |
| ◈श्रु | `◈SHRU` | hearing, listening, reception | 1 | in | PHI |
| ◈ज्ञा | `◈JNA` | knowing, cognition, intelligence | 3 | internal | PHI³ |
| ◈धृ | `◈DHRI` | holding, maintaining, persistence | 2 | internal | PHI² |

### Voltage Levels

| Voltage | PHI Weight | Priority | Use Case |
|---------|------------|----------|----------|
| 1 | PHI¹ (1.618) | Low | Communication, listening |
| 2 | PHI² (2.618) | Normal | Transfer, persistence, I/O |
| 3 | PHI³ (4.236) | High | Existence, action, cognition |
| 4 | PHI⁴ (6.854) | Critical | Laws, sovereignty |

### Direction Types

| Direction | Meaning |
|-----------|---------|
| `in` | Receives from outside |
| `out` | Emits to outside |
| `internal` | Self-referential operation |
| `bidirectional` | Both in and out |

---

## ⟁ KĀRAKA — Semantic Roles (Circuit Pathways)

NOVA's 6 semantic pathway types define **WHO does WHAT to WHOM**:

| Symbol | Name | Meaning | Example |
|--------|------|---------|---------|
| ⟁A | Agent | Who performs | `brain` executes cognition |
| ⟁P | Patient | What is affected | `state` is changed |
| ⟁I | Instrument | By what means | Via `proof_trace` |
| ⟁R | Recipient | For whom / destination | To `terminal_hub` |
| ⟁S | Source | From where / origin | From `oracle` |
| ⟁L | Locus | Where/when / context | In `D3_Causal` plane |

---

## ⧫ VIBHAKTI — Case Markers (Wire Connections)

NOVA's 8 wire connection types:

| Symbol | Name | Meaning |
|--------|------|---------|
| ⧫1 | Subject | The actor |
| ⧫2 | Object | The target |
| ⧫3 | Means | The tool/method |
| ⧫4 | Purpose | The goal/reason |
| ⧫5 | Origin | The source |
| ⧫6 | Possession | Ownership/relation |
| ⧫7 | Location | Place/time/state |
| ⧫8 | Address | Direct invocation |

---

## ⚡ GridSignal — Message on the Wire

```motoko
public type GridSignal = {
    id : Text;              // "⚡42" - signal ID
    source : Principal;     // sender canister
    dhatu : Text;           // "◈JNA" - root operation
    karaka : Karaka;        // #Agent - semantic role
    payload : Text;         // JSON encoded data
    voltage : Float;        // φ-weighted priority
    timestamp : Int;        // nanoseconds
};
```

---

## Multi-Language Bridges

### Motoko (ICP Canisters)
- `src/organisms/sanskrit_proto/main.mo` — Speaker #1
- `src/organisms/sanproto_grid/main.mo` — Speaker #2
- All other organisms have `receiveSanprotoSignal()` listener

### Python
- `engines/python/sanskrit_proto.py`
- `SanprotoListener` class for receiving signals
- `NOVA_DHATUS` dictionary with all 10 roots

### Julia
- `engines/julia/SanskritProto.jl`
- `SanprotoListener` struct for receiving signals
- Full type definitions for all NOVA types

---

## CPL Law Integration

CPL Laws map to Sanskrit Proto signals:

```python
CPL_LAWS = {
    "CLAIM_IS_NOT_TRUTH": CPLLaw(
        law_id="LAW-001",
        dhatu="◈JNA",      # knowing/cognition
        karaka=Karaka.PATIENT,
        phi_weight=PHI3
    ),
    "TERMINAL_SOVEREIGNTY": CPLLaw(
        law_id="LAW-002", 
        dhatu="◈STHA",     # standing/persistence
        karaka=Karaka.AGENT,
        phi_weight=PHI4
    ),
}
```

---

## Usage Example

### Emitting a Signal (Motoko - speaker only)

```motoko
// Only callable by sanskrit_proto or sanproto_grid
await emit("◈JNA", #Agent, "{\"query\": \"state_check\"}");
```

### Receiving a Signal (Python - listener)

```python
class BrainListener(SanprotoListener):
    async def _process_signal(self, signal: GridSignal):
        if signal.dhatu == "◈JNA":
            # Handle cognition request
            await self.think(signal.payload)
```

### Creating a Wire (Grid)

```motoko
// Connect brain → oracle for cognition signals
let wireId = await grid.createWire(brainId, oracleId, ["◈JNA", "◈SHRU"]);
```

---

## Language Registry

Sanskrit Proto is registered as the **foundation stack** (dimension 0):

| ID | Name | Canister | φ-Weight |
|----|------|----------|----------|
| SKT-D | Dhātu Root Language | sanskrit_proto | PHI⁴ (6.854) |
| SKT-K | Kāraka Role Language | sanskrit_proto | PHI⁴ (6.854) |
| SKT-V | Vibhakti Case Language | sanskrit_proto | PHI³ (4.236) |
| SKT-G | Grid Wiring Language | sanproto_grid | PHI⁴ (6.854) |
| SKT-P | Prāṇa Energy Language | sanskrit_proto | PHI³ (4.236) |
| SKT-C | Citta Consciousness Language | sanskrit_proto | PHI³ (4.236) |

---

## Files

| Path | Language | Purpose |
|------|----------|---------|
| `src/organisms/sanskrit_proto/main.mo` | Motoko | Speaker #1 canister |
| `src/organisms/sanproto_grid/main.mo` | Motoko | Speaker #2 canister |
| `engines/python/sanskrit_proto.py` | Python | Python bridge |
| `engines/julia/SanskritProto.jl` | Julia | Julia bridge |
| `languages/SANSKRIT_PROTO.md` | Markdown | This specification |

---

*Casa de Medina — Architectos de Architectura Inteligente*
