#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  CLOUDCOLONY AGI ENGINE RUNNER — Production-Ready                        ║
# ║  Run, test, and validate all AGI engines in the CloudColony SDK          ║
# ║  © 2024-2026 Casa de Medina — NSCP-2025                                 ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./scripts/agi-engines.sh run [engine]       — Run AGI engine(s)
#   ./scripts/agi-engines.sh test               — Run all engine tests
#   ./scripts/agi-engines.sh validate           — Validate engine integrity
#   ./scripts/agi-engines.sh benchmark          — Run performance benchmarks
#   ./scripts/agi-engines.sh status             — Show engine health status
#   ./scripts/agi-engines.sh doctor             — Diagnose and self-heal issues
#
# Engines:
#   metacognition    — MetaCognition Engine (self-aware reasoning)
#   self-improver    — Recursive Self-Improver (Gödel Machine)
#   emergence        — Emergent Intelligence Engine (swarm cognition)
#   causal           — Causal Reasoning Engine (do-calculus)
#   temporal         — Temporal Abstraction Engine (hierarchical time)
#   all              — All engines

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENGINE_DIR="$ROOT_DIR/sdk/agi-engines"
PROTOCOL_DIR="$ROOT_DIR/protocols"
LOG_DIR="$ROOT_DIR/.nova/logs"
PID_DIR="$ROOT_DIR/.nova/pids"

# Ensure runtime directories exist
mkdir -p "$LOG_DIR" "$PID_DIR"

# φ-constants
PHI_TIMEOUT=42  # φ³ × 10 seconds (≈42s)
PHI_RETRY_BASE=2  # Base retry delay in seconds

# ── Colour Output ─────────────────────────────────────────────────────────────

if [[ -t 1 ]]; then
  C_GRN='\033[0;32m'
  C_RED='\033[0;31m'
  C_YLW='\033[0;33m'
  C_CYN='\033[0;36m'
  C_BLD='\033[1m'
  C_RST='\033[0m'
else
  C_GRN='' C_RED='' C_YLW='' C_CYN='' C_BLD='' C_RST=''
fi

log_ok()   { echo -e "${C_GRN}✓${C_RST} $*"; }
log_err()  { echo -e "${C_RED}✗${C_RST} $*" >&2; }
log_warn() { echo -e "${C_YLW}⚠${C_RST} $*"; }
log_info() { echo -e "${C_CYN}▸${C_RST} $*"; }
log_hdr()  { echo -e "\n${C_BLD}═══ $* ═══${C_RST}"; }

# ── Timestamp Utility ─────────────────────────────────────────────────────────

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_with_ts() {
  echo "[$(timestamp)] $*"
}

# ── Health Check ──────────────────────────────────────────────────────────────

check_node() {
  if ! command -v node &>/dev/null; then
    log_err "Node.js not found. Install Node.js >= 18 to run AGI engines."
    exit 1
  fi
  
  local node_version
  node_version=$(node --version | sed 's/v//' | cut -d. -f1)
  if [[ "$node_version" -lt 18 ]]; then
    log_err "Node.js >= 18 required (found: v${node_version})"
    exit 1
  fi
  
  log_ok "Node.js $(node --version) detected"
}

check_engine_files() {
  if [[ ! -f "$ENGINE_DIR/src/index.js" ]]; then
    log_err "AGI engine source not found at: $ENGINE_DIR/src/index.js"
    exit 1
  fi
  
  if [[ ! -f "$ENGINE_DIR/package.json" ]]; then
    log_err "Engine package.json not found"
    exit 1
  fi
  
  log_ok "Engine files present"
}

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_run() {
  local engine="${1:-all}"
  log_hdr "Running AGI Engine: ${engine}"
  
  check_node
  check_engine_files
  
  local run_script="
    import {
      MetaCognitionEngine,
      RecursiveSelfImprover,
      EmergentIntelligenceEngine,
      CausalReasoningEngine,
      TemporalAbstractionEngine,
      AGIEngineOrchestrator
    } from '${ENGINE_DIR}/src/index.js';

    const orchestrator = new AGIEngineOrchestrator();
    orchestrator.start();

    console.log(JSON.stringify(orchestrator.getMetrics(), null, 2));

    // Keep alive for demonstration
    setTimeout(() => {
      console.log('\\n--- Final Metrics ---');
      console.log(JSON.stringify(orchestrator.getMetrics(), null, 2));
      orchestrator.stop();
      process.exit(0);
    }, 5000);
  "
  
  log_info "Starting engine orchestrator..."
  
  if timeout "$PHI_TIMEOUT" node --input-type=module -e "$run_script" 2>&1 | tee "$LOG_DIR/agi-engines-$(date +%s).log"; then
    log_ok "Engine run completed successfully"
  else
    log_err "Engine run failed (exit code: $?)"
    return 1
  fi
}

cmd_test() {
  log_hdr "Testing AGI Engines"
  
  check_node
  check_engine_files
  
  local test_script="
    import {
      MetaCognitionEngine,
      RecursiveSelfImprover,
      EmergentIntelligenceEngine,
      CausalReasoningEngine,
      TemporalAbstractionEngine,
      AGIEngineOrchestrator
    } from '${ENGINE_DIR}/src/index.js';

    let passed = 0;
    let failed = 0;

    function assert(condition, msg) {
      if (condition) { passed++; console.log('  ✓ ' + msg); }
      else { failed++; console.error('  ✗ ' + msg); }
    }

    // Test 1: MetaCognitionEngine
    console.log('\\n[MetaCognitionEngine]');
    const meta = new MetaCognitionEngine();
    assert(meta.id.startsWith('meta-'), 'Creates with ID');
    assert(meta.confidenceThreshold > 0.6, 'φ-threshold set');
    const result = await meta.reason({ type: 'test', data: 'hello' });
    assert(result.confidence >= 0, 'Produces confidence score');
    assert(result.depth >= 0, 'Reports depth');
    meta.stop();

    // Test 2: RecursiveSelfImprover
    console.log('\\n[RecursiveSelfImprover]');
    const rsi = new RecursiveSelfImprover();
    rsi.registerPolicy('test', (input) => input.value * 1.5);
    assert(rsi.policyRegistry.size === 1, 'Policy registered');
    const improvement = await rsi.improve();
    assert(improvement.generation === 1, 'Generation incremented');

    // Test 3: EmergentIntelligenceEngine
    console.log('\\n[EmergentIntelligenceEngine]');
    const emerge = new EmergentIntelligenceEngine();
    emerge.addAgent('a1', (state) => ({ state: { activation: 0.5 } }));
    emerge.addAgent('a2', (state) => ({ state: { activation: 0.5 } }));
    emerge.addAgent('a3', (state) => ({ state: { activation: 0.5 } }));
    assert(emerge.agents.size === 3, 'Agents added');
    const tickResult = await emerge.tick();
    assert(tickResult.tick === 1, 'Tick incremented');

    // Test 4: CausalReasoningEngine
    console.log('\\n[CausalReasoningEngine]');
    const causal = new CausalReasoningEngine();
    causal.addVariable('X').addVariable('Y').addCause('X', 'Y');
    assert(causal.variables.size === 2, 'Variables defined');
    assert(causal.edges.length === 1, 'Causal edge added');
    const intervention = causal.intervene('X', 5.0);
    assert(intervention.type === 'intervention', 'Intervention works');

    // Test 5: TemporalAbstractionEngine
    console.log('\\n[TemporalAbstractionEngine]');
    const temporal = new TemporalAbstractionEngine();
    temporal.recordEvent({ type: 'test', value: 1 });
    temporal.recordEvent({ type: 'test', value: 2 });
    assert(temporal.queryLevel('micro').length === 2, 'Events recorded');
    const attention = temporal.computeAttention('micro');
    assert(attention.attended.length === 2, 'Attention computed');

    // Test 6: AGIEngineOrchestrator
    console.log('\\n[AGIEngineOrchestrator]');
    const orch = new AGIEngineOrchestrator();
    orch.start();
    assert(orch.engines.size === 5, 'All 5 engines initialized');
    const metrics = orch.getMetrics();
    assert(metrics.running === true, 'Orchestrator running');
    orch.stop();

    // Summary
    console.log('\\n' + '═'.repeat(60));
    console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
    console.log('═'.repeat(60));
    
    process.exit(failed > 0 ? 1 : 0);
  "
  
  log_info "Running engine test suite..."
  
  if node --input-type=module -e "$test_script" 2>&1 | tee "$LOG_DIR/agi-test-$(date +%s).log"; then
    log_ok "All tests passed"
  else
    log_err "Some tests failed"
    return 1
  fi
}

cmd_validate() {
  log_hdr "Validating AGI Engine Integrity"
  
  check_node
  check_engine_files
  
  local errors=0
  
  # Check syntax
  log_info "Checking JavaScript syntax..."
  if node --check "$ENGINE_DIR/src/index.js" 2>/dev/null; then
    log_ok "Engine source syntax valid"
  else
    log_err "Engine source has syntax errors"
    ((errors++)) || true
  fi
  
  # Check protocol syntax
  for proto_file in "$PROTOCOL_DIR"/cloudcolony-protocol/index.js "$PROTOCOL_DIR"/workflow-orchestration/index.js; do
    if [[ -f "$proto_file" ]]; then
      if node --check "$proto_file" 2>/dev/null; then
        log_ok "$(basename "$(dirname "$proto_file")")/$(basename "$proto_file") — syntax valid"
      else
        log_err "$(basename "$proto_file") has syntax errors"
        ((errors++)) || true
      fi
    fi
  done
  
  # Check package.json
  log_info "Checking package.json..."
  if node -e "JSON.parse(require('fs').readFileSync('$ENGINE_DIR/package.json', 'utf8'))" 2>/dev/null; then
    log_ok "package.json is valid JSON"
  else
    log_err "package.json is invalid"
    ((errors++)) || true
  fi
  
  # Check file sizes (sanity check)
  local engine_size
  engine_size=$(wc -c < "$ENGINE_DIR/src/index.js")
  if [[ "$engine_size" -gt 1000 ]]; then
    log_ok "Engine source size: ${engine_size} bytes"
  else
    log_warn "Engine source seems too small: ${engine_size} bytes"
  fi
  
  echo ""
  if [[ "$errors" -eq 0 ]]; then
    log_ok "All validations passed"
  else
    log_err "${errors} validation(s) failed"
    return 1
  fi
}

cmd_benchmark() {
  log_hdr "Running AGI Engine Benchmarks"
  
  check_node
  check_engine_files
  
  local bench_script="
    import {
      MetaCognitionEngine,
      RecursiveSelfImprover,
      EmergentIntelligenceEngine,
      CausalReasoningEngine,
      TemporalAbstractionEngine
    } from '${ENGINE_DIR}/src/index.js';

    async function bench(name, fn, iterations = 100) {
      const start = performance.now();
      for (let i = 0; i < iterations; i++) await fn();
      const elapsed = performance.now() - start;
      console.log('  ' + name.padEnd(35) + (elapsed / iterations).toFixed(3) + 'ms/op  (' + iterations + ' iterations)');
    }

    console.log('\\nAGI Engine Benchmarks');
    console.log('─'.repeat(60));

    const meta = new MetaCognitionEngine();
    await bench('MetaCognition.reason()', () => meta.reason({ type: 'test' }));
    meta.stop();

    const rsi = new RecursiveSelfImprover();
    rsi.registerPolicy('bench', (x) => x.value * 1.5);
    await bench('RecursiveSelfImprover.improve()', () => rsi.improve(), 20);

    const emerge = new EmergentIntelligenceEngine();
    for (let i = 0; i < 10; i++) emerge.addAgent('a'+i, (s) => ({ state: { activation: 0.5 } }));
    await bench('Emergence.tick() (10 agents)', () => emerge.tick(), 50);

    const causal = new CausalReasoningEngine();
    causal.addVariable('X').addVariable('Y').addVariable('Z');
    causal.addCause('X', 'Y').addCause('Y', 'Z');
    await bench('Causal.intervene()', () => causal.intervene('X', Math.random() * 10));

    const temporal = new TemporalAbstractionEngine();
    await bench('Temporal.recordEvent()', () => temporal.recordEvent({ type: 'bench', value: Math.random() }));

    console.log('─'.repeat(60));
    console.log('Benchmark complete\\n');
  "
  
  log_info "Running benchmarks..."
  node --input-type=module -e "$bench_script" 2>&1 | tee "$LOG_DIR/agi-bench-$(date +%s).log"
}

cmd_status() {
  log_hdr "AGI Engine Status"
  
  echo ""
  log_info "Engine Directory: $ENGINE_DIR"
  log_info "Protocol Directory: $PROTOCOL_DIR"
  log_info "Log Directory: $LOG_DIR"
  echo ""
  
  # Check files
  local engines=("agi-engines/src/index.js" "agi-engines/package.json" "agi-engines/RESEARCH_PAPERS.md")
  local protocols=("cloudcolony-protocol/index.js" "workflow-orchestration/index.js")
  
  echo "  SDK Engines:"
  for f in "${engines[@]}"; do
    if [[ -f "$ROOT_DIR/sdk/$f" ]]; then
      local size
      size=$(wc -c < "$ROOT_DIR/sdk/$f")
      log_ok "  sdk/$f (${size} bytes)"
    else
      log_err "  sdk/$f — MISSING"
    fi
  done
  
  echo ""
  echo "  Protocols:"
  for f in "${protocols[@]}"; do
    if [[ -f "$ROOT_DIR/protocols/$f" ]]; then
      local size
      size=$(wc -c < "$ROOT_DIR/protocols/$f")
      log_ok "  protocols/$f (${size} bytes)"
    else
      log_err "  protocols/$f — MISSING"
    fi
  done
  
  echo ""
  
  # Show recent logs
  local log_count
  log_count=$(find "$LOG_DIR" -name "agi-*" -type f 2>/dev/null | wc -l)
  log_info "Recent engine logs: $log_count files"
}

cmd_doctor() {
  log_hdr "AGI Engine Doctor — Self-Heal"
  
  local fixed=0
  
  # Create missing directories
  for dir in "$LOG_DIR" "$PID_DIR"; do
    if [[ ! -d "$dir" ]]; then
      mkdir -p "$dir"
      log_ok "Created directory: $dir"
      ((fixed++)) || true
    fi
  done
  
  # Check Node.js
  check_node
  
  # Validate engine source
  if ! node --check "$ENGINE_DIR/src/index.js" 2>/dev/null; then
    log_err "Engine source has syntax errors — manual fix required"
  else
    log_ok "Engine source is valid"
  fi
  
  # Clean stale logs (older than 7 days)
  local stale_logs
  stale_logs=$(find "$LOG_DIR" -name "agi-*" -mtime +7 -type f 2>/dev/null | wc -l)
  if [[ "$stale_logs" -gt 0 ]]; then
    find "$LOG_DIR" -name "agi-*" -mtime +7 -type f -delete 2>/dev/null
    log_ok "Cleaned $stale_logs stale log files"
    ((fixed++)) || true
  fi
  
  echo ""
  if [[ "$fixed" -gt 0 ]]; then
    log_ok "Fixed $fixed issue(s)"
  else
    log_ok "No issues found — all healthy"
  fi
}

# ── Main Dispatch ─────────────────────────────────────────────────────────────

usage() {
  cat <<EOF
${C_BLD}CLOUDCOLONY AGI ENGINE RUNNER — Production${C_RST}

Usage:
  ./scripts/agi-engines.sh run [engine]    Run AGI engine(s)
  ./scripts/agi-engines.sh test            Run all engine tests
  ./scripts/agi-engines.sh validate        Validate engine integrity
  ./scripts/agi-engines.sh benchmark       Run performance benchmarks
  ./scripts/agi-engines.sh status          Show engine health status
  ./scripts/agi-engines.sh doctor          Diagnose and self-heal issues

Engines: metacognition, self-improver, emergence, causal, temporal, all
EOF
}

main() {
  local cmd="${1:-}"
  shift || true
  
  case "$cmd" in
    run)       cmd_run "$@" ;;
    test)      cmd_test ;;
    validate)  cmd_validate ;;
    benchmark) cmd_benchmark ;;
    bench)     cmd_benchmark ;;
    status)    cmd_status ;;
    doctor)    cmd_doctor ;;
    help|--help|-h) usage ;;
    *)
      if [[ -z "$cmd" ]]; then
        usage
      else
        log_err "Unknown command: $cmd"
        usage
        exit 1
      fi
      ;;
  esac
}

main "$@"
