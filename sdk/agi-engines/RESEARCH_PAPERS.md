# AGI Engines — Research Foundations & Theoretical Basis

## Overview

The CloudColony AGI Engine suite is grounded in peer-reviewed research spanning
artificial general intelligence, cognitive architectures, causal inference, and
complex adaptive systems. Each engine implements specific theoretical frameworks
with φ-weighted mathematics native to the NOVA protocol.

---

## Engine 1: MetaCognitionEngine

### Theoretical Foundation
Self-monitoring cognitive architecture inspired by Global Workspace Theory and
Higher-Order Thought theory.

### Key Papers

1. **Schmidhuber, J. (2015).** "On Learning to Think: Algorithmic Information Theory for Novel Combinations of Reinforcement Learning Controllers and Recurrent Neural World Models." *arXiv:1511.09249*
   - Foundation for learning-to-think architectures with self-referential reasoning

2. **Bengio, Y. (2017).** "The Consciousness Prior." *arXiv:1709.08568*
   - Proposes a prior for consciousness: sparse, low-dimensional thought representation
   - Used in our attention buffer and salience computation

3. **Baars, B.J. (1988).** "A Cognitive Theory of Consciousness." *Cambridge University Press*
   - Global Workspace Theory: consciousness as broadcast to specialized processors
   - Implemented in our `attend()` method and attention buffer

4. **Rosenthal, D.M. (2005).** "Consciousness and Mind." *Oxford University Press*
   - Higher-Order Thought theory: metacognition as thoughts about thoughts
   - Implemented in our introspection loop architecture

5. **Nelson, T.O. & Narens, L. (1990).** "Metamemory: A Theoretical Framework and New Findings." *Psychology of Learning and Motivation, 26, 125-173*
   - Monitoring-control framework for metacognition
   - Basis for our strategy selection and adjustment mechanisms

### Implementation Mapping
| Paper Concept | Engine Implementation |
|---|---|
| Global Workspace broadcast | `attend()` + attention buffer |
| Higher-Order Thought | `_introspect()` recursion |
| Consciousness Prior | Low-dim confidence vectors |
| Learning to Think | Strategy selection via performance history |

---

## Engine 2: RecursiveSelfImprover

### Theoretical Foundation
Gödel Machine architecture: provably optimal self-referential improvement.

### Key Papers

1. **Schmidhuber, J. (2007).** "Gödel Machines: Fully Self-Referential Optimal Universal Self-Improvers." *In Artificial General Intelligence, Springer, pp. 199-226*
   - Core architecture: self-modifications only applied when provably beneficial
   - Implemented in our proof-search verification pipeline

2. **Nivel, E. et al. (2013).** "Autocatalytic Endogenous Reflective Architecture." *IIIA Technical Report*
   - Self-reflective systems that bootstrap from simple rules
   - Influenced our generation-based improvement cycles

3. **Legg, S. & Hutter, M. (2007).** "Universal Intelligence: A Definition of Machine Intelligence." *Minds and Machines, 17(4), 391-444*
   - Formal definition of intelligence as performance across environments
   - Used in our fitness evaluation across test distributions

4. **Hernández-Orallo, J. (2017).** "The Measure of All Minds." *Cambridge University Press*
   - Evaluation frameworks for diverse cognitive systems
   - Influenced our multi-dimensional fitness scoring

5. **Steunebrink, B.R. et al. (2016).** "Growing Recursive Self-Improvers." *AGI 2016, LNAI 9782*
   - Practical recursive self-improvement with bounded computation
   - Basis for our `maxRecursionDepth` and convergence detection

### Implementation Mapping
| Paper Concept | Engine Implementation |
|---|---|
| Proof search | `_verifyImprovement()` |
| Self-modification | `_applyImprovement()` (only when verified) |
| Universal intelligence | Multi-input fitness evaluation |
| Convergence criteria | `_checkConvergence()` via variance monitoring |

---

## Engine 3: EmergentIntelligenceEngine

### Theoretical Foundation
Intelligence as emergent property of interacting simple agents on scale-free networks.

### Key Papers

1. **Minsky, M. (1988).** "The Society of Mind." *Simon & Schuster*
   - Intelligence emerges from interaction of unintelligent agents
   - Core architecture of our micro-agent society

2. **Barabási, A.L. & Albert, R. (1999).** "Emergence of Scaling in Random Networks." *Science, 286(5439), 509-512*
   - Scale-free network formation via preferential attachment
   - Implemented in `_attachPreferentially()`

3. **Kuramoto, Y. (1984).** "Chemical Oscillations, Waves, and Turbulence." *Springer*
   - Synchronization of coupled oscillators
   - Used in emergence detection (coherence measurement)

4. **Kauffman, S.A. (1993).** "The Origins of Order: Self-Organization and Selection in Evolution." *Oxford University Press*
   - Edge-of-chaos and emergent order in complex systems
   - Theoretical basis for our emergence detection thresholds

5. **Holland, J.H. (1995).** "Hidden Order: How Adaptation Builds Complexity." *Perseus Books*
   - Complex adaptive systems and emergence
   - Influenced our tick-based simulation with message passing

6. **Bonabeau, E. et al. (1999).** "Swarm Intelligence: From Natural to Artificial Systems." *Oxford University Press*
   - Collective intelligence from local interactions
   - Message-passing architecture between agents

### Implementation Mapping
| Paper Concept | Engine Implementation |
|---|---|
| Society of Mind | Agent map with behavior functions |
| Preferential attachment | `_attachPreferentially()` (BA model) |
| Kuramoto sync | `_detectEmergence()` variance check |
| Swarm communication | Message queues + tick cycles |

---

## Engine 4: CausalReasoningEngine

### Theoretical Foundation
Pearl's structural causal models and the three-level causal hierarchy.

### Key Papers

1. **Pearl, J. (2009).** "Causality: Models, Reasoning, and Inference." *Cambridge University Press, 2nd Edition*
   - Complete framework for causal inference
   - Three levels: association, intervention, counterfactual
   - All three levels implemented in the engine

2. **Schölkopf, B. et al. (2022).** "Causality for Machine Learning." *In Probabilistic and Causal Inference: The Works of Judea Pearl, ACM*
   - Connecting causal inference to machine learning
   - Influenced our integration with other AGI engines

3. **Peters, J., Janzing, D., & Schölkopf, B. (2017).** "Elements of Causal Inference." *MIT Press*
   - Practical algorithms for causal discovery and inference
   - Basis for our structural equation mechanisms

4. **Bareinboim, E. & Pearl, J. (2016).** "Causal Inference and the Data-Fusion Problem." *PNAS, 113(27), 7345-7352*
   - Combining data from multiple sources for causal inference
   - Influenced our observation aggregation

5. **Halpern, J.Y. (2016).** "Actual Causality." *MIT Press*
   - Formal definitions of actual causation
   - Theoretical backing for our counterfactual engine

### Implementation Mapping
| Paper Concept | Engine Implementation |
|---|---|
| do-calculus | `intervene()` with graph mutation |
| Counterfactuals | `counterfactual()` — abduct, action, predict |
| SCM (DAG + equations) | `variables` + `mechanisms` maps |
| Causal hierarchy | Three method levels: observe, intervene, counterfactual |

---

## Engine 5: TemporalAbstractionEngine

### Theoretical Foundation
Hierarchical temporal representation combining reinforcement learning options
with self-attention mechanisms.

### Key Papers

1. **Sutton, R.S., Precup, D., & Singh, S. (1999).** "Between MDPs and Semi-MDPs: A Framework for Temporal Abstraction in Reinforcement Learning." *Artificial Intelligence, 112(1-2), 181-211*
   - Options framework for temporal abstraction
   - Implemented in our `defineOption()` method

2. **Vaswani, A. et al. (2017).** "Attention Is All You Need." *NeurIPS*
   - Self-attention mechanism for sequence modeling
   - Implemented in `computeAttention()` with temporal weighting

3. **Botvinick, M.M. (2008).** "Hierarchical Models of Behavior and Prefrontal Function." *Trends in Cognitive Sciences, 12(5), 201-208*
   - Hierarchical processing in biological cognition
   - Inspired our four-level temporal hierarchy

4. **Hawkins, J. & Blakeslee, S. (2004).** "On Intelligence." *Times Books*
   - Hierarchical Temporal Memory theory
   - Influenced bottom-up abstraction mechanism

5. **Buonomano, D.V. & Maass, W. (2009).** "State-dependent Computations: Spatiotemporal Processing in Cortical Networks." *Nature Reviews Neuroscience, 10, 113-125*
   - Neural basis of temporal processing
   - Influenced our multi-scale event stream architecture

### Implementation Mapping
| Paper Concept | Engine Implementation |
|---|---|
| Options (RL) | `defineOption()` with init/policy/term |
| Self-attention | `computeAttention()` with φ-decay |
| Temporal hierarchy | 4 levels: micro/meso/macro/meta |
| Bottom-up chunking | `_abstractUpward()` temporal grouping |

---

## Cross-Engine Integration Papers

These papers inform the AGIEngineOrchestrator that coordinates all engines:

1. **Laird, J.E. (2012).** "The Soar Cognitive Architecture." *MIT Press*
   - Unified cognitive architecture principles
   
2. **Franklin, S. et al. (2014).** "LIDA: A Systems-level Architecture for Cognition, Emotion, and Learning." *IEEE Trans. Autonomous Mental Development, 6(1), 19-41*
   - Multi-module cognitive architecture with attention
   
3. **Goertzel, B. et al. (2014).** "Engineering General Intelligence." *Atlantis Press*
   - Practical approaches to AGI system integration

4. **Kotseruba, I. & Tsotsos, J.K. (2020).** "40 Years of Cognitive Architectures: Core Cognitive Abilities and Practical Applications." *Artificial Intelligence Review, 53, 17-94*
   - Comprehensive survey of cognitive architectures

---

## φ-Mathematics Foundation

All engines use golden ratio (φ ≈ 1.618) mathematics:

- **Livio, M. (2002).** "The Golden Ratio: The Story of Phi." *Broadway Books*
- **Stakhov, A. (2009).** "The Mathematics of Harmony." *World Scientific*

The φ-weighting provides:
- Natural convergence thresholds (φ/(φ+1) ≈ 0.618)
- Self-similar temporal scaling (φ^i hierarchy)
- Optimal information compression ratios

---

*Casa de Medina — Architectos de Architectura Inteligente*
*CloudColony AGI Research Foundation — 2026*
