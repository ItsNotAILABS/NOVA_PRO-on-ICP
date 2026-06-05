# NOVA Protocol AI Training Datasets

> **Total: 105,000+ JSONL records across 24 data domains**

## Files

| File | Lines | Description |
|------|-------|-------------|
| `nova_protocol_training.jsonl` | 69,000 | Core protocol training data |
| `nova_beehive_cloud.jsonl` | 36,000 | Sovereign Beehive Cloud Engine data |

## Format

All files use **JSONL** (JSON Lines) — one JSON object per line. Each record has a `"type"` field identifying its category.

---

## nova_protocol_training.jsonl — Categories

| Type | Records | Description |
|------|---------|-------------|
| `heartbeat_telemetry` | 8,000 | Organism heartbeat metrics (phase, coherence, cycles, memory) |
| `token_economics` | 6,000 | NOVA token transactions, velocity, phi-pricing, supply |
| `neuron_fleet` | 5,000 | NNS 200-neuron fleet management (maturity, disbursement, allocation) |
| `kuramoto_coherence` | 5,000 | Kuramoto coupled oscillator simulations (12-node helix) |
| `cycles_market` | 5,000 | Native Nova Cycles market trades (φ² premium pricing) |
| `agritech_telemetry` | 8,000 | Agricultural intelligence (soil, weather, crop health, irrigation) |
| `governance_proposal` | 4,000 | DAO governance proposals and voting data |
| `phi_mathematics` | 5,000 | φ-harmonic math (Fibonacci, golden spiral, Ramsey pricing, prospect theory) |
| `metal_resonance` | 3,000 | 12-metal resonance pipeline (solfeggio frequencies, cross-coherence) |
| `canister_interaction` | 6,000 | Inter-canister communication graph (latency, cycles, methods) |
| `climate_resilience` | 4,000 | Climate monitoring (temperature anomaly, drought, carbon flux) |
| `instruction_tuning` | 3,000 | Protocol knowledge instruction-response pairs |
| `srce_rotation` | 4,000 | SRCE rotation cycle telemetry (873ms target) |
| `ssn_social_metrics` | 3,000 | SSN sub-coin social scoring (work, trust, governance) |

---

## nova_beehive_cloud.jsonl — Categories

| Type | Records | Description |
|------|---------|-------------|
| `beehive_colony_state` | 5,000 | Full colony snapshots (population, homeostasis, resources, swarm pressure) |
| `worker_lifecycle` | 5,000 | Temporal polyethism transitions (nurse → house → forager, plasticity) |
| `pheromone_signal` | 5,000 | Pheromone communication (QMP, alarm, ethyl oleate, decay, propagation) |
| `waggle_dance` | 4,000 | Waggle dance protocol (direction, distance, quality, recruitment, quorum) |
| `quorum_sensing` | 3,000 | Collective decision-making (scouts, quorum threshold, stop signals) |
| `homeostasis_regulation` | 4,000 | Thermoregulation, resource balance, compute throttling, defense |
| `swarming_event` | 2,000 | Horizontal scaling events (colony split, daughter queen, site selection) |
| `comb_structure` | 3,000 | Hexagonal comb lattice (cell types, utilization, spatial organization) |
| `srce_boundary_enforcement` | 3,000 | SRCE engine public/redacted boundary access control |
| `beehive_instruction_tuning` | 2,000 | Beehive architecture instruction-response pairs |

---

## SRCE Engine Stack — Public/Redacted Boundaries

| Engine | Public Function | Redacted Boundary |
|--------|----------------|-------------------|
| **Connectome** | Maintains internal state-transition and coherence layer | Exact topology, thresholds, field mechanics, protected internals |
| **Governance** | Coordinates internal agents, maintenance, correction, upgrade pressure | Agent wiring, governance routes, private improvement queues, controller details |
| **Substrate** | Tracks operational cost, cycles, artifact events, economic substrate | Financial mechanics, seal logic, ledger bridges, protected accounting paths |
| **Interface** | Presents external surface, visualization, bridge routes, user interaction | Private endpoint details, client bridges, canister IDs, integration keys |

> The split is not decorative. It gives the system clearer responsibility boundaries, cleaner receipt surfaces, and more controlled release gates.

---

## Sovereign Beehive Cloud Architecture

The dataset encodes the full biological mapping of the Sovereign Rotating Cloud Engine to an Apis mellifera colony superorganism:

### Castes → Module Types

| Caste | Compute Analog | Lifecycle |
|-------|---------------|-----------|
| **Queen** | Sovereign governance, agent spawning, QMP cohesion | Persistent (1-5 years) |
| **Nurse Worker** | Memory consolidation, caching, new task tending | Days 1-12 |
| **House Worker** | Reasoning pipelines, knowledge graphs, verification | Days 12-20 |
| **Forager Worker** | External API calls, data ingestion, resource gathering | Days 20-45 |
| **Drone** | Exploratory testing, hybrid integration, genetic diversity | 10-60 days |

### Communication Protocols

- **Waggle Dance** → Structured messaging (encodes direction, distance, quality)
- **Pheromones** → Broadcast signals (QMP, alarm, ethyl oleate, Nasanov, trail markers)
- **Stop Signals** → Inhibitory feedback (halt competing dances/proposals)
- **Quorum Sensing** → Collective decisions via scout consensus (not unanimity)

### Homeostasis Mechanisms

- **Temperature** → Brood nest 34.5°C ± 0.5°C (fanning = throttle, clustering = concentrate)
- **Resources** → Honey/pollen balance targets 0.618 (φ-inverse)
- **Defense** → Guard bees scale with threat level
- **Scaling** → Swarming when colony > 400 modules (φ-split: 61.8%/38.2%)

---

## Key Constants

```
φ (PHI)        = 1.6180339887498948482
φ² (PHI²)      = 2.6180339887498948482
LOV (φ^φ)      = 2.17845...
Golden Angle   = 137.5077640500378°
Rotation Target = 873 ms
Transfer Fee   = 10,000 e8s (burned)
Total Supply   = φ^13 × 10^8 ≈ 521,001,966 NOVA
```

---

## Usage

```python
import json

# Load dataset
records = []
with open("datasets/nova_protocol_training.jsonl") as f:
    for line in f:
        records.append(json.loads(line))

# Filter by type
heartbeats = [r for r in records if r["type"] == "heartbeat_telemetry"]
phi_math = [r for r in records if r["type"] == "phi_mathematics"]
```

```python
# Load beehive data
beehive = []
with open("datasets/nova_beehive_cloud.jsonl") as f:
    for line in f:
        beehive.append(json.loads(line))

# Get colony states
colonies = [r for r in beehive if r["type"] == "beehive_colony_state"]
pheromones = [r for r in beehive if r["type"] == "pheromone_signal"]
```

---

## License

Sovereign (NOVA-internal) — Casa de Medina © 2024-2026
