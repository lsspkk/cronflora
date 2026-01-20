#!/bin/bash
# Configure all Azure SWA app settings from .env

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

az account show > /dev/null 2>&1 || { echo "Run: az login"; exit 1; }

echo "Configuring $APP_NAME..."
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names \
        "GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID" \
        "GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET" \
        "GITHUB_PAT=$GITHUB_PAT" \
        "CRONFLORA_GITHUB_OWNER=$CRONFLORA_GITHUB_OWNER" \
        "CRONFLORA_GITHUB_REPO=$CRONFLORA_GITHUB_REPO" \
        "CRONFLORA_GITHUB_BRANCH=${CRONFLORA_GITHUB_BRANCH:-main}" \
        "CRONFLORA_CONFIG_PATH=${CRONFLORA_CONFIG_PATH:-dokumenttiprojekti/cronflora-config.json}" \
    --output none

echo "Done. Verify: ./status.sh"
