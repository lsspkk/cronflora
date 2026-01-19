#!/bin/bash

# Test SWA Deployment Script
#
# This script simulates the GitHub Actions deployment process locally
# to help debug deployment issues before pushing.
#
# Usage:
#   ./test-swa-deploy.sh          # Full test (build + validate)
#   ./test-swa-deploy.sh --quick  # Quick validation only

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
API_DIR="$PROJECT_DIR/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=== SWA Deployment Test ==="
echo "Project: $PROJECT_DIR"
echo ""

# Check if quick mode
QUICK_MODE=false
if [ "$1" == "--quick" ]; then
    QUICK_MODE=true
    echo "Running in quick validation mode..."
    echo ""
fi

# Step 1: Validate required files exist
echo "Step 1: Validating project structure..."

REQUIRED_FILES=(
    "package.json"
    "public/staticwebapp.config.json"
    "api/package.json"
    "api/host.json"
    "api/tsconfig.json"
    "api/src/functions/getFile.ts"
    "api/src/functions/saveFile.ts"
)

ALL_OK=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$PROJECT_DIR/$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file (MISSING)"
        ALL_OK=false
    fi
done

if [ "$ALL_OK" = false ]; then
    echo -e "\n${RED}Error: Missing required files${NC}"
    exit 1
fi
echo ""

# Step 2: Validate package.json has correct dependencies
echo "Step 2: Validating API dependencies..."

if grep -q '"@azure/functions"' "$API_DIR/package.json"; then
    VERSION=$(grep -o '"@azure/functions": "[^"]*"' "$API_DIR/package.json" | cut -d'"' -f4)
    echo -e "  ${GREEN}✓${NC} @azure/functions: $VERSION"

    # Check if it's v4
    if [[ "$VERSION" == ^4* ]] || [[ "$VERSION" == "^4"* ]]; then
        echo -e "  ${GREEN}✓${NC} Using Functions v4 programming model"
    else
        echo -e "  ${YELLOW}⚠${NC} Not using v4 - version is $VERSION"
    fi
else
    echo -e "  ${RED}✗${NC} @azure/functions not found in package.json"
    exit 1
fi

# Check for engines field
if grep -q '"engines"' "$API_DIR/package.json"; then
    echo -e "  ${GREEN}✓${NC} engines field present (helps runtime detection)"
else
    echo -e "  ${YELLOW}⚠${NC} No engines field - consider adding for runtime detection"
fi
echo ""

# Step 3: Validate host.json
echo "Step 3: Validating host.json..."

if grep -q '"version": "2.0"' "$API_DIR/host.json"; then
    echo -e "  ${GREEN}✓${NC} Functions runtime version 2.0"
else
    echo -e "  ${RED}✗${NC} host.json should have version 2.0"
fi

if grep -q 'extensionBundle' "$API_DIR/host.json"; then
    echo -e "  ${GREEN}✓${NC} Extension bundle configured"
else
    echo -e "  ${YELLOW}⚠${NC} No extension bundle - may need for some features"
fi
echo ""

# Step 4: Build frontend (unless quick mode)
if [ "$QUICK_MODE" = false ]; then
    echo "Step 4: Building frontend..."
    cd "$PROJECT_DIR"

    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm ci
    fi

    echo "  Running typecheck..."
    npm run typecheck

    echo "  Building..."
    npm run build

    if [ -d "dist" ] && [ -f "dist/index.html" ]; then
        echo -e "  ${GREEN}✓${NC} Frontend build successful"
    else
        echo -e "  ${RED}✗${NC} Frontend build failed - dist/index.html not found"
        exit 1
    fi
    echo ""
fi

# Step 5: Build API (unless quick mode)
if [ "$QUICK_MODE" = false ]; then
    echo "Step 5: Building API..."
    cd "$API_DIR"

    if [ ! -d "node_modules" ]; then
        echo "  Installing dependencies..."
        npm install
    fi

    echo "  Running typecheck..."
    npm run typecheck

    echo "  Building..."
    npm run build

    if [ -d "dist/src/functions" ]; then
        echo -e "  ${GREEN}✓${NC} API build successful"
        echo "  Functions found:"
        ls -1 dist/src/functions/*.js 2>/dev/null | while read f; do
            echo "    - $(basename "$f" .js)"
        done
    else
        echo -e "  ${RED}✗${NC} API build failed - dist/src/functions not found"
        exit 1
    fi
    echo ""
fi

# Step 6: Validate staticwebapp.config.json
echo "Step 6: Validating staticwebapp.config.json..."

CONFIG_FILE="$PROJECT_DIR/public/staticwebapp.config.json"

if grep -q '"apiRuntime"' "$CONFIG_FILE"; then
    RUNTIME=$(grep -o '"apiRuntime": "[^"]*"' "$CONFIG_FILE" | cut -d'"' -f4)
    echo -e "  ${GREEN}✓${NC} API runtime configured: $RUNTIME"
else
    echo -e "  ${RED}✗${NC} Missing platform.apiRuntime - required for Node.js 20+"
    echo "    Add to staticwebapp.config.json:"
    echo '    "platform": { "apiRuntime": "node:20" }'
fi

if grep -q '"/api/\*"' "$CONFIG_FILE"; then
    echo -e "  ${GREEN}✓${NC} API routes configured"
fi

if grep -q '"authenticated"' "$CONFIG_FILE"; then
    echo -e "  ${GREEN}✓${NC} Authentication required for API"
else
    echo -e "  ${YELLOW}⚠${NC} API routes may not require authentication"
fi
echo ""

# Step 7: Check SWA CLI (optional)
echo "Step 7: Checking SWA CLI..."

if command -v swa &> /dev/null; then
    SWA_VERSION=$(swa --version 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}✓${NC} SWA CLI installed: $SWA_VERSION"
    echo ""
    echo "  To test locally, run:"
    echo "    cd $PROJECT_DIR"
    echo "    swa start dist --api-location api"
else
    echo -e "  ${YELLOW}⚠${NC} SWA CLI not installed"
    echo "  Install with: npm install -g @azure/static-web-apps-cli"
fi
echo ""

# Summary
echo "=== Summary ==="
if [ "$QUICK_MODE" = true ]; then
    echo -e "${GREEN}Quick validation passed!${NC}"
    echo "Run without --quick to do a full build test."
else
    echo -e "${GREEN}All tests passed!${NC}"
    echo ""
    echo "Ready to push. The deployment will:"
    echo "  1. Use pre-built frontend from dist/"
    echo "  2. Let Azure build the API (detects Node.js runtime)"
    echo ""
    echo "After push, run ./status.sh to verify deployment."
fi
