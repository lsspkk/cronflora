#!/bin/bash

# Configure GitHub OAuth for Azure Static Web App
# Usage: ./configure-github-oauth.sh <github-client-id> <github-client-secret> [resource-group] [app-name]

set -e

GITHUB_CLIENT_ID=${1:?"Usage: ./configure-github-oauth.sh <client-id> <client-secret> [resource-group] [app-name]"}
GITHUB_CLIENT_SECRET=${2:?"Usage: ./configure-github-oauth.sh <client-id> <client-secret> [resource-group] [app-name]"}
RESOURCE_GROUP=${3:-"rg-cronflora-swa-site"}
APP_NAME=${4:-"swa-document-editor"}

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

echo ""
echo "=== GitHub OAuth Configuration Complete ==="
echo ""
echo "Make sure your GitHub OAuth App has these settings:"
echo "  Homepage URL: https://<your-swa-url>.azurestaticapps.net"
echo "  Authorization callback URL: https://<your-swa-url>.azurestaticapps.net/.auth/login/github/callback"
echo ""
echo "To create a GitHub OAuth App:"
echo "  1. Go to https://github.com/settings/developers"
echo "  2. Click 'New OAuth App'"
echo "  3. Fill in the details above"
echo "  4. Copy Client ID and Client Secret"
