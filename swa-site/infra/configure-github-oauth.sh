#!/bin/bash

# Configure GitHub OAuth for Azure Static Web App
# Usage: ./configure-github-oauth.sh [resource-group] [app-name]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

RESOURCE_GROUP=${1:-${RESOURCE_GROUP:-"rg-cronflora-swa-site"}}
APP_NAME=${2:-${APP_NAME:-"swa-document-editor"}}

if [ -z "$GITHUB_CLIENT_ID" ] || [ -z "$GITHUB_CLIENT_SECRET" ]; then
    echo "Error: GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set in .env file"
    exit 1
fi

echo "=== Configuring GitHub OAuth ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo ""

# Check if logged in to Azure
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure first: az login"
    exit 1
}

# Configure app settings for GitHub OAuth
echo "Setting GitHub OAuth credentials..."
az staticwebapp appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --setting-names \
        "GITHUB_CLIENT_ID=$GITHUB_CLIENT_ID" \
        "GITHUB_CLIENT_SECRET=$GITHUB_CLIENT_SECRET" \
    --output none

# Get the actual app URL
SWA_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query defaultHostname -o tsv)

echo ""
echo "=== GitHub OAuth Configuration Complete ==="
echo ""
echo "Your GitHub OAuth App should have these settings:"
echo "  Homepage URL: https://$SWA_URL"
echo "  Authorization callback URL: https://$SWA_URL/.auth/login/github/callback"
echo ""
echo "If not configured, go to https://github.com/settings/developers"
