#!/usr/bin/env bash
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║  NOVA MAINNET DEPLOYMENT SCRIPT                                          ║
# ║  Deploy protocol canisters to the Internet Computer mainnet              ║
# ║  © 2024-2026 Casa de Medina — NSCP-2025                                 ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# Usage:
#   ./scripts/deploy-mainnet.sh [track] [--dry-run]
#
# Tracks:
#   defi       — nova_token, ssn_*, cycles_market, revenue_engine, etc.
#   ai         — brain, agi_main, turing, braindex, cerebex, cordex
#   agritech   — agronomist, aquaflow, biosentry, cultivar, phenologix
#   infra      — cloud_engine, protocol_engine, guardian, oracle
#   governance — sns_dao, ssn_gov, praesidium, custos
#   all        — Deploy all tracks
#
# Examples:
#   ./scripts/deploy-mainnet.sh defi --dry-run
#   ./scripts/deploy-mainnet.sh ai
#   ./scripts/deploy-mainnet.sh all

set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────────────────

NETWORK="ic"
DRY_RUN=false
TRACK="${1:-}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ── Parse Arguments ───────────────────────────────────────────────────────────

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      head -25 "$0" | tail -20
      exit 0
      ;;
  esac
done

TRACK="${1:-}"

if [ -z "$TRACK" ]; then
  echo -e "${RED}Error: No track specified${NC}"
  echo ""
  echo "Usage: ./scripts/deploy-mainnet.sh [track] [--dry-run]"
  echo ""
  echo "Available tracks: defi, ai, agritech, infra, governance, all"
  exit 1
fi

# ── Functions ─────────────────────────────────────────────────────────────────

deploy_canister() {
  local name="$1"
  local desc="${2:-}"

  if [ "$DRY_RUN" = true ]; then
    echo -e "  ${YELLOW}[DRY RUN]${NC} Would deploy: ${BLUE}$name${NC} ${desc}"
  else
    echo -e "  ${BLUE}→${NC} Deploying ${BLUE}$name${NC} ${desc}..."
    dfx deploy "$name" --network "$NETWORK" --yes
    echo -e "  ${GREEN}✓${NC} $name deployed"
  fi
}

section_header() {
  echo ""
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  $1${NC}"
  echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

# ── Pre-flight Checks ─────────────────────────────────────────────────────────

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  NOVA Protocol — Mainnet Deployment                      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}⚠  DRY RUN MODE — No actual deployment will occur${NC}"
  echo ""
fi

echo -e "Track:   ${BLUE}$TRACK${NC}"
echo -e "Network: ${BLUE}$NETWORK${NC}"
echo ""

# Check dfx is installed (unless dry run)
if [ "$DRY_RUN" = false ]; then
  if ! command -v dfx &> /dev/null; then
    echo -e "${RED}Error: dfx is not installed.${NC}"
    echo "Install with: sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
  fi
  echo -e "${GREEN}✓${NC} dfx found: $(dfx --version)"
fi

# Type-check before deploying
echo -e "\n${BLUE}Running pre-flight type check...${NC}"
cd "$ROOT_DIR"
./scripts/nova check
echo -e "${GREEN}✓${NC} All canisters type-check passed"

# ── Track Deployments ─────────────────────────────────────────────────────────

deploy_defi() {
  section_header "Track 1: DeFi / Token Infrastructure"

  deploy_canister "nova_token" "(ICRC-1/2, fee: 10,000 e8s deflationary)"
  deploy_canister "revenue_engine" "(golden distribution epoch model)"
  deploy_canister "cycles_market" "(NNC marketplace, φ² premium)"
  deploy_canister "divi" "(AI economic orchestrator)"
  deploy_canister "auto_market" "(four-engine autonomous cycle mint)"
  deploy_canister "nns_proxy" "(200-neuron NNS fleet manager)"
  deploy_canister "icp_coverage" "(ICP position tracker)"

  echo ""
  echo -e "  ${BLUE}Building Rust SSN tokens...${NC}"
  if [ "$DRY_RUN" = false ]; then
    cargo build --target wasm32-unknown-unknown --release
  fi

  deploy_canister "ssn_work" "(Rust ICRC-1 — work rewards)"
  deploy_canister "ssn_trust" "(Rust ICRC-1 — trust score)"
  deploy_canister "ssn_gov" "(Rust ICRC-1 — governance weight)"

  echo ""
  echo -e "${GREEN}✓ DeFi Track deployment complete (10 canisters)${NC}"
}

deploy_ai() {
  section_header "Track 2: AI-on-Chain Platform"

  deploy_canister "brain" "(central cognitive organism)"
  deploy_canister "agi_main" "(AGI orchestrator)"
  deploy_canister "turing" "(computation engine)"
  deploy_canister "braindex" "(neural indexer)"
  deploy_canister "cerebex" "(cognitive processor)"
  deploy_canister "cordex" "(coordination engine)"

  echo ""
  echo -e "${GREEN}✓ AI Track deployment complete (6 canisters)${NC}"
}

deploy_agritech() {
  section_header "Track 3: AgriTech / Climate"

  deploy_canister "agronomist" "(precision agriculture)"
  deploy_canister "aquaflow" "(water management)"
  deploy_canister "biosentry" "(biosecurity alerts)"
  deploy_canister "cultivar" "(crop genetics)"
  deploy_canister "phenologix" "(phenology engine)"
  deploy_canister "terragenesis" "(land modeling)"
  deploy_canister "resiliex" "(climate resilience)"

  echo ""
  echo -e "${GREEN}✓ AgriTech Track deployment complete (7 canisters)${NC}"
}

deploy_infra() {
  section_header "Track 4: Sovereign Cloud / Infrastructure"

  deploy_canister "cloud_engine" "(multi-tenant hosting)"
  deploy_canister "protocol_engine" "(protocol orchestration)"
  deploy_canister "guardian" "(security guardian)"
  deploy_canister "oracle" "(data oracle)"
  deploy_canister "netmind" "(network intelligence)"
  deploy_canister "meshweaver" "(mesh networking)"
  deploy_canister "signalforge" "(signal processing)"

  echo ""
  echo -e "${GREEN}✓ Infrastructure Track deployment complete (7 canisters)${NC}"
}

deploy_governance() {
  section_header "Track 5: Governance-as-a-Service"

  deploy_canister "sns_dao" "(SNS DAO organism)"
  deploy_canister "praesidium" "(governance framework)"
  deploy_canister "custos" "(protocol guardian)"
  deploy_canister "sovereign" "(substrate core)"

  echo ""
  echo -e "${GREEN}✓ Governance Track deployment complete (4 canisters)${NC}"
}

# ── Execute Selected Track ────────────────────────────────────────────────────

case "$TRACK" in
  defi)
    deploy_defi
    ;;
  ai)
    deploy_ai
    ;;
  agritech)
    deploy_agritech
    ;;
  infra)
    deploy_infra
    ;;
  governance)
    deploy_governance
    ;;
  all)
    deploy_defi
    deploy_ai
    deploy_agritech
    deploy_infra
    deploy_governance
    ;;
  *)
    echo -e "${RED}Error: Unknown track '$TRACK'${NC}"
    echo "Available tracks: defi, ai, agritech, infra, governance, all"
    exit 1
    ;;
esac

# ── Summary ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Deployment Summary${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  Track:   ${BLUE}$TRACK${NC}"
echo -e "  Network: ${BLUE}$NETWORK${NC}"
echo -e "  Mode:    $([ "$DRY_RUN" = true ] && echo -e "${YELLOW}DRY RUN${NC}" || echo -e "${GREEN}LIVE${NC}")"
echo ""

if [ "$DRY_RUN" = false ]; then
  echo -e "  ${GREEN}Next steps:${NC}"
  echo "    1. Verify canister status: dfx canister status <name> --network ic"
  echo "    2. Check cycle balance: dfx canister status <name> --network ic"
  echo "    3. Run post-deployment tests"
  echo ""
fi

echo -e "${GREEN}Done.${NC}"
