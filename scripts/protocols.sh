#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  CLOUDCOLONY PROTOCOL RUNNER — Production-Ready                          ║
# ║  Deploy, test, and manage CloudColony protocols                          ║
# ║  © 2024-2026 Casa de Medina — NSCP-2025                                 ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./scripts/protocols.sh test              — Run protocol test suite
#   ./scripts/protocols.sh validate          — Validate all protocol files
#   ./scripts/protocols.sh list              — List available protocols
#   ./scripts/protocols.sh status            — Show protocol health
#   ./scripts/protocols.sh simulate [proto]  — Run protocol simulation

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROTOCOL_DIR="$ROOT_DIR/protocols"
LOG_DIR="$ROOT_DIR/.nova/logs"

mkdir -p "$LOG_DIR"

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

# ── Commands ──────────────────────────────────────────────────────────────────

cmd_list() {
  log_hdr "Available CloudColony Protocols"
  echo ""
  
  for dir in "$PROTOCOL_DIR"/*/; do
    if [[ -d "$dir" ]]; then
      local name
      name=$(basename "$dir")
      local files
      files=$(find "$dir" -type f | wc -l)
      log_info "$name ($files files)"
    fi
  done
  
  # Also list standalone protocol files
  echo ""
  log_info "Standalone protocols:"
  for f in "$PROTOCOL_DIR"/*.js; do
    if [[ -f "$f" ]]; then
      log_info "  $(basename "$f")"
    fi
  done
}

cmd_validate() {
  log_hdr "Validating CloudColony Protocols"
  
  local errors=0
  local checked=0
  
  # Validate all .js files in protocol directories
  while IFS= read -r -d '' file; do
    ((checked++)) || true
    if node --check "$file" 2>/dev/null; then
      log_ok "$(echo "$file" | sed "s|$ROOT_DIR/||")"
    else
      log_err "$(echo "$file" | sed "s|$ROOT_DIR/||") — SYNTAX ERROR"
      ((errors++)) || true
    fi
  done < <(find "$PROTOCOL_DIR" -name "*.js" -print0)
  
  echo ""
  if [[ "$errors" -eq 0 ]]; then
    log_ok "All $checked protocol files validated successfully"
  else
    log_err "$errors/$checked files have errors"
    return 1
  fi
}

cmd_test() {
  log_hdr "Testing CloudColony Protocols"
  
  if ! command -v node &>/dev/null; then
    log_err "Node.js required"
    exit 1
  fi
  
  local test_script="
    import {
      CloudColonyProtocol,
      ColonyRegistry,
      ColonyHeartbeat,
      ColonyConsensus,
      ColonyTaskAllocator,
      ColonyKnowledge,
      ColonyEvolution
    } from '${PROTOCOL_DIR}/cloudcolony-protocol/index.js';

    import {
      WorkflowBuilder,
      WorkflowExecutor,
      createAGIWorkflows
    } from '${PROTOCOL_DIR}/workflow-orchestration/index.js';

    let passed = 0;
    let failed = 0;

    function assert(condition, msg) {
      if (condition) { passed++; console.log('  ✓ ' + msg); }
      else { failed++; console.error('  ✗ ' + msg); }
    }

    // Test CloudColony Protocol
    console.log('\\n[CloudColonyProtocol]');
    const colony = new CloudColonyProtocol();
    assert(colony.version === '1.0.0-phi', 'Protocol version set');

    const reg = colony.join({ id: 'org-1', capabilities: ['reasoning', 'learning'], endpoint: 'local' });
    assert(reg.id === 'org-1', 'Organism registered');
    assert(reg.trustScore > 0.6, 'Initial trust score is φ-inverse');

    colony.join({ id: 'org-2', capabilities: ['learning'], endpoint: 'local' });
    const discovered = colony.registry.discover('reasoning');
    assert(discovered.length === 1, 'Discovery finds capability match');

    // Test Consensus
    console.log('\\n[ColonyConsensus]');
    const consensus = new ColonyConsensus();
    const propId = consensus.propose('org-1', { action: 'upgrade' });
    assert(propId.startsWith('prop-'), 'Proposal created');
    consensus.vote(propId, 'v1', 'accept');
    consensus.vote(propId, 'v2', 'accept');
    consensus.vote(propId, 'v3', 'reject');
    const status = consensus.getStatus(propId);
    assert(status.acceptance > 0.6, 'Consensus tracks acceptance ratio');

    // Test Task Allocator
    console.log('\\n[ColonyTaskAllocator]');
    const allocator = new ColonyTaskAllocator();
    const taskId = allocator.submitTask({ capabilities: ['reasoning'], payload: {} });
    allocator.bid(taskId, 'org-1', ['reasoning', 'learning'], 0.9);
    allocator.bid(taskId, 'org-2', ['learning'], 0.5);
    const allocation = allocator.allocate(taskId);
    assert(allocation.assignedTo === 'org-1', 'Task assigned to best match');

    // Test Knowledge
    console.log('\\n[ColonyKnowledge]');
    const knowledge = new ColonyKnowledge();
    const factId = knowledge.share('org-1', { content: 'φ is the golden ratio', category: 'math', confidence: 0.9 });
    assert(factId.startsWith('fact-'), 'Fact shared');
    const results = knowledge.query('math');
    assert(results.length === 1, 'Knowledge query works');

    // Test Workflow Orchestration
    console.log('\\n[WorkflowOrchestration]');
    const workflow = new WorkflowBuilder('test-workflow')
      .step('step1', async (input) => ({ ...input, step1: true }))
      .step('step2', async (input) => ({ ...input, step2: true }))
      .chain('step1', 'step2')
      .build();
    assert(workflow.name === 'test-workflow', 'Workflow built');

    const executor = new WorkflowExecutor();
    const execution = await executor.execute(workflow, { initial: true });
    assert(execution.status === 'completed', 'Workflow executed successfully');
    assert(execution.output.step1 === true, 'Step 1 output present');
    assert(execution.output.step2 === true, 'Step 2 output present');

    // Test predefined AGI workflows
    console.log('\\n[AGI Workflows]');
    const agiWorkflows = createAGIWorkflows();
    assert('deepReasoning' in agiWorkflows, 'Deep reasoning workflow exists');
    assert('collectiveIntelligence' in agiWorkflows, 'Collective intelligence workflow exists');
    assert('selfImprovement' in agiWorkflows, 'Self-improvement workflow exists');

    const deepResult = await executor.execute(agiWorkflows.deepReasoning, { query: 'test' });
    assert(deepResult.status === 'completed', 'Deep reasoning workflow completes');

    // Summary
    console.log('\\n' + '═'.repeat(60));
    console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
    console.log('═'.repeat(60));
    
    colony.stop();
    process.exit(failed > 0 ? 1 : 0);
  "
  
  log_info "Running protocol test suite..."
  
  if node --input-type=module -e "$test_script" 2>&1 | tee "$LOG_DIR/protocol-test-$(date +%s).log"; then
    log_ok "All protocol tests passed"
  else
    log_err "Some protocol tests failed"
    return 1
  fi
}

cmd_simulate() {
  local proto="${1:-cloudcolony}"
  log_hdr "Simulating Protocol: ${proto}"
  
  local sim_script="
    import { CloudColonyProtocol } from '${PROTOCOL_DIR}/cloudcolony-protocol/index.js';

    const colony = new CloudColonyProtocol();
    colony.start();

    // Simulate 5 organisms joining
    for (let i = 1; i <= 5; i++) {
      colony.join({
        id: 'sim-org-' + i,
        capabilities: ['reasoning', 'learning', 'evolution'].slice(0, i % 3 + 1),
        endpoint: 'sim://localhost:' + (8000 + i)
      });
    }

    console.log('Colony Status:');
    console.log(JSON.stringify(colony.getStatus(), null, 2));

    // Simulate consensus
    const propId = colony.consensus.propose('sim-org-1', { action: 'evolve', target: 'all' });
    for (let i = 1; i <= 5; i++) {
      colony.consensus.vote(propId, 'sim-org-' + i, i <= 4 ? 'accept' : 'reject');
    }
    console.log('\\nConsensus Result:');
    console.log(JSON.stringify(colony.consensus.getStatus(propId), null, 2));

    colony.stop();
  "
  
  node --input-type=module -e "$sim_script" 2>&1 | tee "$LOG_DIR/protocol-sim-$(date +%s).log"
}

cmd_status() {
  log_hdr "Protocol Status"
  
  echo ""
  log_info "Protocol Directory: $PROTOCOL_DIR"
  echo ""
  
  for dir in "$PROTOCOL_DIR"/*/; do
    if [[ -d "$dir" ]]; then
      local name
      name=$(basename "$dir")
      local js_files
      js_files=$(find "$dir" -name "*.js" -type f | wc -l)
      local total_size
      total_size=$(find "$dir" -type f -exec wc -c {} + 2>/dev/null | tail -1 | awk '{print $1}')
      log_ok "$name — $js_files JS files, ${total_size:-0} bytes total"
    fi
  done
}

# ── Main Dispatch ─────────────────────────────────────────────────────────────

usage() {
  cat <<EOF
${C_BLD}CLOUDCOLONY PROTOCOL RUNNER — Production${C_RST}

Usage:
  ./scripts/protocols.sh test              Run protocol test suite
  ./scripts/protocols.sh validate          Validate all protocol files
  ./scripts/protocols.sh list              List available protocols
  ./scripts/protocols.sh status            Show protocol health
  ./scripts/protocols.sh simulate [proto]  Run protocol simulation
EOF
}

main() {
  local cmd="${1:-}"
  shift || true
  
  case "$cmd" in
    test)      cmd_test ;;
    validate)  cmd_validate ;;
    list)      cmd_list ;;
    status)    cmd_status ;;
    simulate)  cmd_simulate "$@" ;;
    sim)       cmd_simulate "$@" ;;
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
