#!/usr/bin/env bash
#
# Run all CI checks locally
#
# Usage:
#   ./scripts/ci-local.sh           # Run all checks (stop on first failure)
#   ./scripts/ci-local.sh --all     # Run all checks (continue on failure)
#   ./scripts/ci-local.sh --help    # Show help
#
# This script runs:
#   - Backend checks via Docker (api container)
#   - Frontend checks locally (npm)
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default options
CONTINUE_ON_FAILURE=false
FAILED_CHECKS=()

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Run all CI checks locally"
    echo ""
    echo "This runs backend checks via Docker and frontend checks locally."
    echo ""
    echo "Options:"
    echo "  --all       Continue running all checks even if one fails"
    echo "  --help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0              # Run all checks, stop on first failure"
    echo "  $0 --all        # Run all checks, report all failures at end"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --all)
            CONTINUE_ON_FAILURE=true
            shift
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_failure() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

run_check() {
    local name="$1"
    shift
    local cmd=("$@")

    print_info "Running: ${cmd[*]}"
    echo ""

    if "${cmd[@]}"; then
        print_success "$name passed"
        return 0
    else
        print_failure "$name failed"
        FAILED_CHECKS+=("$name")
        if [[ "$CONTINUE_ON_FAILURE" == false ]]; then
            echo ""
            echo -e "${RED}Stopping due to failure. Use --all to continue on failure.${NC}"
            exit 1
        fi
        return 1
    fi
}

# Run all checks (backend via Docker, frontend locally)
run_checks() {
    # ===== BACKEND CHECKS (via Docker) =====
    print_header "Backend Checks (via Docker)"

    # Check if Docker is running
    if ! docker info &>/dev/null; then
        echo -e "${RED}Error: Docker is not running${NC}"
        exit 1
    fi

    # Check if api container is up
    cd "$PROJECT_ROOT"
    if ! docker compose ps --status running 2>/dev/null | grep -q "rae-budget-api"; then
        print_info "Starting Docker containers..."
        docker compose up -d
        sleep 3
    fi

    print_header "Backend Lint (Ruff)"
    run_check "Ruff linter" docker compose exec -T api uv run ruff check .
    echo ""
    run_check "Ruff formatter" docker compose exec -T api uv run ruff format --check .

    print_header "Backend Tests"
    run_check "Backend tests" docker compose exec -T api uv run pytest tests/ -v --cov=app --cov-report=term-missing

    # ===== FRONTEND CHECKS (locally) =====
    print_header "Frontend Checks (local)"

    cd "$PROJECT_ROOT/frontend"

    if ! command -v npm &>/dev/null; then
        echo -e "${RED}Error: 'npm' is not installed${NC}"
        exit 1
    fi

    # Check if node_modules exists, if not install
    if [[ ! -d "node_modules" ]]; then
        print_info "Installing frontend dependencies..."
        npm ci
    fi

    print_header "Frontend Lint (ESLint)"
    run_check "ESLint" npm run lint

    print_header "Frontend Type Check & Build"
    run_check "TypeScript check" npx tsc --noEmit
    run_check "Frontend build" npm run build

    print_header "Frontend Tests"
    run_check "Frontend tests" npm test -- --run

    cd "$PROJECT_ROOT"
}

# Main execution
main() {
    cd "$PROJECT_ROOT"

    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                    RAE-BUDGET CI CHECKS                       ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    run_checks

    # Summary
    echo ""
    print_header "Summary"

    if [[ ${#FAILED_CHECKS[@]} -eq 0 ]]; then
        echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                    ALL CHECKS PASSED! ✓                       ║${NC}"
        echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
        exit 0
    else
        echo -e "${RED}╔═══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║                    SOME CHECKS FAILED ✗                       ║${NC}"
        echo -e "${RED}╚═══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Failed checks:"
        for check in "${FAILED_CHECKS[@]}"; do
            echo -e "  ${RED}✗ $check${NC}"
        done
        exit 1
    fi
}

main