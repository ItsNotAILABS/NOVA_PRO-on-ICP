# @medina/agi-engines

> Deep AGI Engines for the CloudColony SDK — Research-backed, production-ready,
> workflow-embedded artificial general intelligence components.

## Engines

| Engine | Purpose | Key Paper |
|--------|---------|-----------|
| **MetaCognitionEngine** | Self-aware reasoning with introspection loops | Schmidhuber (2015) |
| **RecursiveSelfImprover** | Gödel Machine-inspired self-modification | Schmidhuber (2007) |
| **EmergentIntelligenceEngine** | Multi-agent emergence & swarm cognition | Minsky (1988) |
| **CausalReasoningEngine** | Interventional & counterfactual reasoning | Pearl (2009) |
| **TemporalAbstractionEngine** | Hierarchical temporal representation | Sutton et al. (1999) |
| **AGIEngineOrchestrator** | Unified workflow coordination | Laird (2012) |

## Quick Start

```javascript
import { AGIEngineOrchestrator } from '@medina/agi-engines';

const agi = new AGIEngineOrchestrator();
agi.start();

// Use metacognition for self-aware reasoning
const result = await agi.getEngine('metacognition').reason({
  type: 'analysis',
  data: { query: 'What patterns exist in this data?' }
});

// Use causal engine for intervention analysis
const causal = agi.getEngine('causal');
causal.addVariable('treatment').addVariable('outcome');
causal.addCause('treatment', 'outcome');
const effect = causal.intervene('treatment', 1.0);

// Register and execute workflows
agi.registerWorkflow('analyze', [
  { name: 'perceive', engine: 'temporal', execute: (e, d) => e.recordEvent(d) },
  { name: 'reason', engine: 'metacognition', execute: (e, d) => e.reason(d) },
  { name: 'improve', engine: 'selfImprover', execute: (e, d) => e.improve() }
]);

const output = await agi.executeWorkflow('analyze', { type: 'test' });
```

## Production Scripts

```bash
# Run engines
./scripts/agi-engines.sh run

# Test all engines
./scripts/agi-engines.sh test

# Validate integrity
./scripts/agi-engines.sh validate

# Run benchmarks
./scripts/agi-engines.sh benchmark

# Check health
./scripts/agi-engines.sh status

# Self-heal
./scripts/agi-engines.sh doctor
```

## Architecture

```
AGIEngineOrchestrator
├── MetaCognitionEngine (introspection depth: 3, φ-threshold: 0.618)
├── RecursiveSelfImprover (proof-verified modifications only)
├── EmergentIntelligenceEngine (Barabási-Albert network topology)
├── CausalReasoningEngine (Pearl's 3-level hierarchy)
└── TemporalAbstractionEngine (micro/meso/macro/meta timescales)
```

## φ-Mathematics

All engines use golden ratio (φ ≈ 1.618) mathematics:
- **Confidence threshold**: φ/(φ+1) ≈ 0.618
- **Temporal scaling**: φ^i hierarchy (1s, 1.618s, 2.618s, 4.236s)
- **Convergence**: φ-exponential backoff for retries
- **Network growth**: Preferential attachment with φ-weighting

## Research Papers

See [RESEARCH_PAPERS.md](./RESEARCH_PAPERS.md) for complete bibliography
with 30+ papers mapped to specific engine implementations.

## License

NSCP-2025 — Casa de Medina
