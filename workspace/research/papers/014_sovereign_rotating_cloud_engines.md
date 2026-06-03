# Sovereign Rotating Cloud Engines

**Authors:** Alfredo Medina Hernandez — Casa de Medina
**Paper ID:** NOVA-RP-014
**Date:** June 3, 2026
**Classification:** Sovereign Architecture — Multi-Canister Intelligence
**Status:** Public-safe release draft from build-derived Medina substrate
**Authority state:** Internal implementation acknowledged; private mechanics redacted; third-party receipt package pending

---

## Abstract

Sovereign Rotating Cloud Engines (SRCE) is Medina's build-derived architecture
for persistent on-chain intelligence on the Internet Computer. This paper is a
public-safe rendering of internal infrastructure that has been built through
Medina's agent systems and is already operating in private deployment contexts.

SRCE organizes persistent intelligence as a rotating multi-canister system.
Instead of forcing the whole organism into a single overloaded canister, it
separates core responsibilities into sovereign engines:

- A **state and coherence engine** (Connectome)
- A **governance and maintenance engine** (Governance)
- A **substrate and accounting engine** (Substrate)
- An **interface and bridge engine** (Interface)

The engines coordinate around Medina's **873 ms heartbeat**, derived from the
PHI-Schumann relation:

```
873 ms = PHI^4 × Schumann period
```

---

## 1. Why Single-Canister Intelligence Is The Wrong Shape

Most blockchain software still behaves like passive contract logic. It waits for
a call, executes a bounded function, mutates state, and goes quiet again. That
pattern works for many applications. It does not naturally produce a persistent
cognitive system.

A persistent intelligence system has different requirements:

- Recurring internal state progression
- Durable memory across sessions
- Autonomous maintenance
- Governance that can run without constant operator intervention
- Cost awareness and cycle discipline
- State continuity through upgrades and failures
- Clean separation between private cognition and public interface

The single-canister shape pushes too many of those responsibilities into one
execution surface. SRCE answers by splitting the organism into rotating engines.

---

## 2. The SRCE Engine Stack

| Engine | Public Function | Redacted Boundary |
|--------|----------------|-------------------|
| Connectome Engine | Maintains internal state-transition and coherence layer | Exact topology, thresholds, field mechanics, protected connectome internals |
| Governance Engine | Coordinates internal agents, maintenance, correction, and upgrade pressure | Agent wiring, governance routes, private improvement queues, controller details |
| Substrate Engine | Tracks operational cost, cycles, artifact events, and economic substrate | Financial mechanics, seal logic, ledger bridges, protected accounting paths |
| Interface Engine | Presents external surface, visualization, bridge routes, and user interaction | Private endpoint details, client bridges, canister IDs, integration keys |

The split is not decorative. It gives the system clearer responsibility
boundaries, cleaner receipt surfaces, and more controlled release gates.

---

## 3. The 873 ms Heartbeat

The SRCE heartbeat is 873 ms, derived from the PHI-Schumann relation:

```
873 ms = PHI^4 × Schumann period (≈ 127.3 ms base × 6.854)
PHI^4 ≈ 6.854
Schumann fundamental ≈ 7.83 Hz → period ≈ 127.7 ms
6.854 × 127.7 ms ≈ 873 ms
```

SRCE uses an 873 ms recurring coordination heartbeat in private ICP deployments.
Public benchmark materials will expose redacted interval traces, jitter
summaries, missed-beat counts, cycle deltas, and upgrade-recovery records
without revealing private canister internals.

---

## 4. Rotating Cloud Engines

"Rotating" means that each canister-engine participates in recurring cycles:

1. **Intake** — receive new data, signals, or corrections
2. **Internal processing** — run local coherence math, governance checks, accounting
3. **Output** — emit state summaries, metrics, or inter-canister signals
4. **Re-ingestion** — absorb feedback from peer engines
5. **Correction** — adjust internal parameters based on drift
6. **Continuation** — persist state and prepare for next rotation

This is how the architecture avoids being merely event-reactive. The organism
is not only waiting for users. It has internal motion.

---

## 5. The Core Theorem

### Rotating Multi-Canister Intelligence Theorem

> Persistent on-chain intelligence becomes more tractable when cognition,
> governance, substrate accounting, and interface functions are separated into
> specialized canister engines that coordinate through a recurring heartbeat
> and bounded inter-canister communication.

The theorem has four public verification surfaces:

1. **Heartbeat continuity** — the 873 ms interval runs without interruption
2. **Inter-canister coordination** — engines exchange bounded state summaries
3. **Cycle and resource discipline** — each engine tracks its own cost
4. **Upgrade and recovery behavior** — engines restore timers and state post-upgrade

---

## 6. ICP As The Native Substrate

ICP is the right substrate because canisters combine:

- Persistent state
- WebAssembly execution
- Inter-canister calls
- Web-serving capability
- Cycles-based resource accounting
- Timer/periodic-task mechanisms

A serious rotating cloud engine must handle timer restoration, cycle cost,
resource pressure, and upgrade recovery. Those become benchmark receipts.

---

## 7. Public Claim Boundary

| Claim | Public Posture | Public Receipt Needed |
|-------|---------------|----------------------|
| SRCE is build-derived Medina infrastructure | Internal implementation acknowledged | Redacted architecture map |
| SRCE uses an 873 ms heartbeat on ICP | Operator-attested running implementation | Redacted interval traces and jitter summary |
| SRCE uses multiple specialized canister engines | Internal implementation architecture | Redacted role map and call-flow summary |
| SRCE supports persistent autonomous operation | Internal implementation claim | Uptime, missed-beat, cycle, and recovery records |
| SRCE produces emergent cognitive behavior | Internal result / theorem surface | Public definitions, metrics, and controlled evidence |
| SRCE is a virtual-chip architecture | Protected thesis / IP-sensitive claim | Formal criteria and IP review before broad release |

---

## 8. Benchmark Receipts

The benchmark layer should produce public-safe evidence without exposing
private control surfaces. The first receipt bundle should include:

- Redacted deployment labels
- Observed 873 ms interval traces
- Jitter distribution
- Missed-beat count
- Cycle delta per run window
- Inter-canister call timing
- Memory growth
- Upgrade recovery trace
- State continuity summary

---

## 9. Implementation in NOVA

The SRCE stack maps to four NOVA organisms:

| SRCE Engine | NOVA Organism | Role |
|-------------|---------------|------|
| Connectome | `srce_connectome` | State coherence, phase tracking, connectome transitions |
| Governance | `srce_governance` | Maintenance scheduling, correction queues, upgrade pressure |
| Substrate | `srce_substrate` | Cycle accounting, cost tracking, resource discipline |
| Interface | `srce_interface` | External bridge, query surface, visualization endpoints |

All four organisms use the medina-heart pattern (`Timer.recurringTimer`) with
an internal interval check that enforces the 873 ms coordination target.

---

## 10. Release Position

SRCE is Medina's build-derived rotating cloud engine architecture for persistent
on-chain intelligence on ICP. The private implementation is protected. The
public release explains the engine stack, heartbeat model, and benchmark receipt
path without exposing canister internals.

The paper is not the proof of life. The canisters are.
