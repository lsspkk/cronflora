#!/bin/bash

# Configure Cronflora repository settings in Azure
# Reads CRONFLORA_* values from .env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

# Load CRONFLORA_* variables from .env
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | grep 'CRONFLORA_' | xargs 2>/dev/null) || true
fi

if [ -z "$CRONFLORA_GITHUB_OWNER" ] || [ -z "$CRONFLORA_GITHUB_REPO" ]; then
    echo "Error: CRONFLORA_GITHUB_OWNER and CRONFLORA_GITHUB_REPO must be set in .env"
    exit 1
fi

# Defaults
CRONFLORA_GITHUB_BRANCH="${CRONFLORA_GITHUB_BRANCH:-main}"
CRONFLORA_CONFIG_PATH="${CRONFLORA_CONFIG_PATH:-dokumenttiprojekti/cronflora-config.json}"

# Check Azure login
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure first: az login"
    exit 1
}

echo "Setting CRONFLORA_* app settings..."
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names \
        "CRONFLORA_GITHUB_OWNER=$CRONFLORA_GITHUB_OWNER" \
        "CRONFLORA_GITHUB_REPO=$CRONFLORA_GITHUB_REPO" \
        "CRONFLORA_GITHUB_BRANCH=$CRONFLORA_GITHUB_BRANCH" \
        "CRONFLORA_CONFIG_PATH=$CRONFLORA_CONFIG_PATH" \
    --output none

echo "Done. Verify with: ./status.sh"
