# NOVA Platform Technology Integration Guide

**Golden-Spiral Architecture with φ-Mathematics Foundation**

This document describes the modern web technology integrations implemented for the NOVA PRO platform, aligned with φ-mathematics principles (Fibonacci sequences, golden ratios, Kuramoto oscillators).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Phase 1: Styling — Tailwind φ-Config](#phase-1-styling--tailwind-φ-config)
3. [Phase 2: State Management](#phase-2-state-management)
4. [Phase 3: Web Components](#phase-3-web-components)
5. [Phase 4: Network Layer](#phase-4-network-layer)
6. [Phase 5: Security Layer](#phase-5-security-layer)
7. [Phase 6: Testing Layer](#phase-6-testing-layer)
8. [Phase 7: DevOps Layer](#phase-7-devops-layer)
9. [φ-Mathematics Patterns](#φ-mathematics-patterns)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NOVA Platform Stack                       │
├─────────────────────────────────────────────────────────────┤
│  Rendering     │ React 18 + Lit Web Components              │
│  State         │ Zustand + XState + React Query             │
│  Build         │ Vite + Tailwind CSS                        │
│  Style         │ Tailwind φ-config + CSS Variables          │
│  Data          │ React Query (Fibonacci revalidation)       │
│  Network       │ Service Worker (φ-caching)                 │
│  Security      │ CSP + Fibonacci hash chains                │
│  Testing       │ Vitest (φ-weighted priority)               │
│  DevOps        │ GitHub Actions (Fibonacci stages)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Styling — Tailwind φ-Config

### Location
`src/frontend/tailwind.config.js`

### φ-Spacing Scale

```javascript
spacing: {
  // Golden ratio progression
  'phi-0': '0.618rem',     // 1/φ
  'phi-1': '1rem',         // 1
  'phi-2': '1.618rem',     // φ
  'phi-3': '2.618rem',     // φ²
  'phi-4': '4.236rem',     // φ³
  
  // Fibonacci sequence
  'fib-5': '0.625rem',     // F(5)/8
  'fib-8': '1rem',         // F(8)/8
  'fib-13': '1.625rem',    // F(13)/8
  'fib-21': '2.625rem',    // F(21)/8
}
```

### Fibonacci Grid Columns

```javascript
gridTemplateColumns: {
  'fib-5': '1fr 1fr 2fr 3fr 5fr',  // 1:1:2:3:5
  'phi': '1fr 1.618fr',            // 1:φ
}
```

### Usage

```jsx
<div className="grid grid-cols-phi gap-fib-8 p-phi-3">
  <aside className="flex-fib-1">Sidebar</aside>
  <main className="flex-phi">Content</main>
</div>
```

---

## Phase 2: State Management

### Zustand Store
`src/frontend/src/store/nova-store.ts`

**Features:**
- φ-weighted state tree with priority routing
- Fibonacci-threshold state transitions
- Canister state management
- Organism connection tracking

```typescript
import { useNovaStore, shouldTransition, fib } from '@/store';

// Only update if change exceeds Fibonacci threshold
if (shouldTransition(oldValue, newValue, fib(5))) {
  store.updateMetrics({ totalCycles: newValue });
}
```

### XState Canister Lifecycle
`src/frontend/src/store/canister-machine.ts`

**Lifecycle States:**
```
dormant → initializing → active → migrating → evolved
                                      ↓
                                   error
```

**Fibonacci Timeouts:**
- Initialization timeout: 1618ms (φ × 1000)
- Migration timeout: 8090ms (5 × φ × 1000)
- State transition debounce: 89ms (F(11))

### React Query
`src/frontend/src/store/query-client.tsx`

**Fibonacci Revalidation Intervals:**
```typescript
const FIB_INTERVALS = {
  FAST: 5 * 1000,      // F(5) = 5 seconds
  STANDARD: 8 * 1000,  // F(8) = 8 seconds
  SLOW: 13 * 1000,     // F(13) = 13 seconds
  LAZY: 21 * 1000,     // F(21) = 21 seconds
};
```

---

## Phase 3: Web Components

### Location
`packages/nova-components/`

### Available Components

| Component | Description | φ-Feature |
|-----------|-------------|-----------|
| `<nova-canister-card>` | Canister status card | Element class styling |
| `<nova-organism-grid>` | Golden-spiral layout | Phyllotaxis positioning |
| `<nova-health-gauge>` | Circular health meter | φ-threshold indicators |
| `<nova-connection-line>` | Organism connections | φ-weighted signal strength |

### Usage

```html
<nova-organism-grid scale="30" center-offset="200">
  <nova-canister-card
    canister-id="brain"
    name="Brain"
    status="active"
    element-class="crimson"
    cycles="1000000000"
    memory="100000000">
  </nova-canister-card>
</nova-organism-grid>
```

### Golden-Spiral Layout

```typescript
import { phyllotaxisXY } from '@nova-protocol/nova-components';

// Position element n in golden spiral
const { x, y } = phyllotaxisXY(n, scale);
element.style.transform = `translate(${x}px, ${y}px)`;
```

---

## Phase 4: Network Layer

### Service Worker
`src/frontend/public/sw.js`

**φ-Caching Strategy:**

| Content Type | Cache Strategy | TTL |
|--------------|---------------|-----|
| Canister status | Stale-while-revalidate | F(5) = 5s |
| Canister queries | Stale-while-revalidate | F(8) = 8s |
| API data | Network-first | F(13) = 13s |
| Static assets | Cache-first | F(89) = 89s |

**Registration:**
```typescript
import { registerServiceWorker } from '@/lib/service-worker';

await registerServiceWorker();
```

**Cache Management:**
```typescript
import { invalidateCache, clearAllCaches, getCacheStats } from '@/lib/service-worker';

// Invalidate specific URLs
invalidateCache(['/api/canister/brain/status']);

// Get Fibonacci-level statistics
const stats = await getCacheStats();
console.log(stats.fibLevels);  // { 5: 3, 8: 12, 13: 5 }
```

---

## Phase 5: Security Layer

### Location
`src/frontend/src/lib/security.ts`

### Fibonacci Hash Chain

```typescript
import { FibonacciHashChain } from '@/lib/security';

const chain = new FibonacciHashChain();
await chain.initialize('seed-value', 100);

// H(n) = hash(H(n-1) || H(n-2))
const hash10 = chain.getHashHex(10);
```

### φ-Derived Key Derivation

```typescript
import { deriveKey, generateSalt } from '@/lib/security';

const salt = generateSalt();  // F(7) = 16 bytes
const key = await deriveKey(password, salt);  // F(16) = 987 iterations
```

### Content Security Policy

```typescript
import { generateCSPHeader, CSP_CONFIG } from '@/lib/security';

// Generate CSP header for ICP boundary nodes
const cspHeader = generateCSPHeader(CSP_CONFIG);
```

---

## Phase 6: Testing Layer

### Configuration
`src/frontend/vitest.config.ts`

### φ-Coverage Thresholds

```typescript
coverage: {
  thresholds: {
    lines: 61.8,      // 1/φ minimum
    functions: 61.8,
    branches: 61.8,
    statements: 61.8,
  },
}
```

### Test Priority Scoring

```typescript
import { calculateTestPriority } from '@/tests/setup';

const priority = calculateTestPriority({
  riskLevel: 'critical',  // φ⁴ weight
  complexity: 8,
  coverage: 0.5,
});
```

### Running Tests

```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run for CI
npm run test:ci
```

---

## Phase 7: DevOps Layer

### CI/CD Workflow
`.github/workflows/ci.yml`

### Fibonacci Pipeline Stages

| Stage | Fibonacci | Timeout |
|-------|-----------|---------|
| 1. Lint | F(1) = 1 | 8 min |
| 2. Test | F(2) = 1 | 13 min |
| 3. Build | F(3) = 2 | 21 min |
| 5. Deploy-STG | F(5) = 5 | 34 min |
| 8. Deploy-PRD | F(8) = 21 | 55 min |

### Artifact Retention

- Test results: 13 days (F(7))
- Coverage reports: 13 days (F(7))
- Build artifacts: 21 days (F(8))

---

## φ-Mathematics Patterns

### Core Constants

```typescript
const PHI = 1.6180339887498948482;
const PHI_INV = 0.6180339887498948;
const GOLDEN_ANGLE_DEG = 137.50776;
const PHI_MS = 1618;  // φ × 1000 milliseconds
```

### Common Patterns

**1. Fibonacci Threshold Guards:**
```typescript
if (delta >= nearestFib(delta)) {
  // Perform expensive operation
}
```

**2. φ-Weighted Priority:**
```typescript
const priority = Math.pow(PHI, tier);
```

**3. Golden-Spiral Positioning:**
```typescript
const angle = index * GOLDEN_ANGLE_RAD;
const radius = Math.sqrt(index) * scale;
const x = radius * Math.cos(angle);
const y = radius * Math.sin(angle);
```

**4. Fibonacci Timing:**
```typescript
const delays = [5, 8, 13, 21, 34, 55, 89, 144];
const retryDelay = delays[attempt] * 1000;
```

---

## File Structure

```
src/frontend/
├── public/
│   └── sw.js                    # Service Worker (φ-caching)
├── src/
│   ├── store/
│   │   ├── nova-store.ts        # Zustand store
│   │   ├── canister-machine.ts  # XState lifecycle
│   │   ├── query-client.tsx     # React Query config
│   │   └── index.ts
│   ├── lib/
│   │   ├── security.ts          # Fibonacci hash chains
│   │   └── service-worker.ts    # SW registration
│   └── components/
├── tests/
│   ├── setup.ts                 # φ-test utilities
│   └── store.test.ts
├── tailwind.config.js           # φ-spacing config
├── vitest.config.ts             # φ-coverage thresholds
└── package.json

packages/nova-components/
├── src/
│   ├── phi-utils.ts             # φ-mathematics
│   ├── elements/
│   │   ├── nova-canister-card.ts
│   │   ├── nova-organism-grid.ts
│   │   ├── nova-health-gauge.ts
│   │   └── nova-connection-line.ts
│   └── index.ts
├── package.json
└── tsconfig.json

.github/workflows/
├── ci.yml                       # Fibonacci pipeline
└── motoko-check.yml             # Canister validation
```

---

## Quick Start

```bash
# Install dependencies
cd src/frontend
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

---

**Casa de Medina — Architectos de Architectura Inteligente**

*"We don't build AI systems. We certify living intelligences."*
