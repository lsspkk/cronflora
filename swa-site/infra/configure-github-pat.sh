#!/bin/bash

# Configure GitHub Personal Access Token for Azure Functions backend
#
# The PAT is stored as an Azure app setting (NOT prefixed with VITE_)
# so it is only available server-side in Azure Functions, never exposed to the browser.
#
# Usage:
#   ./configure-github-pat.sh <github-pat>
#
# To create a PAT:
#   1. Go to https://github.com/settings/tokens/new
#   2. Name: "CronFlora Production" (or similar)
#   3. Expiration: 90 days recommended
#   4. Select scope: "repo" (Full control of private repositories)
#   5. Generate and copy token

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Load FUNCTIONS_API_GITHUB_PAT from .env file if not provided as argument
if [ -f "$SCRIPT_DIR/.env" ]; then
    # Export only the FUNCTIONS_API_GITHUB_PAT variable
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep 'FUNCTIONS_API_GITHUB_PAT' | xargs)
fi

GITHUB_PAT="${1:-$FUNCTIONS_API_GITHUB_PAT}"

if [ -z "$GITHUB_PAT" ]; then
    echo "Usage: $0 [github-pat]"
    echo ""
    echo "You can either:"
    echo "  1. Provide PAT as argument: $0 ghp_xxxxx"
    echo "  2. Set FUNCTIONS_API_GITHUB_PAT in $SCRIPT_DIR/.env"
    echo ""
    echo "To create a GitHub PAT:"
    echo "  1. Go to https://github.com/settings/tokens/new"
    echo "  2. Select scope: repo"
    echo "  3. Generate and copy token"
    exit 1
fi

echo "=== Configuring GitHub PAT ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo ""

# Check if logged in to Azure
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure first: az login"
    exit 1
}

# Validate PAT format (should start with ghp_ for classic tokens or github_pat_ for fine-grained)
if [[ ! "$GITHUB_PAT" =~ ^(ghp_|github_pat_) ]]; then
    echo "Warning: PAT doesn't match expected GitHub token format (ghp_* or github_pat_*)"
    read -p "Continue anyway? (y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Set the PAT as an app setting (without VITE_ prefix - server-side only)
echo "Setting FUNCTIONS_API_GITHUB_PAT app setting..."
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names "FUNCTIONS_API_GITHUB_PAT=$GITHUB_PAT" \
    --output none

echo ""
echo "=== Configuration Complete ==="
echo "FUNCTIONS_API_GITHUB_PAT has been set as an Azure app setting."
echo ""
echo "Security notes:"
echo "  - The PAT is stored server-side only (no VITE_ prefix)"
echo "  - It will NOT be exposed to the browser"
echo "  - Azure Functions use it to access GitHub API"
echo ""
echo "Next steps:"
echo "  1. Verify with: ./status.sh"
echo "  2. Deploy any Azure Functions that use this setting"
