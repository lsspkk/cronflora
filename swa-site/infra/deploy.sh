#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "=== Azure Static Web App Deployment ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo "Location: $LOCATION"
echo ""

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure first: az login"
    exit 1
}

# Check if app name is available
echo "Checking if app name is available..."
NAME_CHECK=$(az staticwebapp show --name "$APP_NAME" --query name -o tsv 2>/dev/null || echo "")
if [ ! -z "$NAME_CHECK" ]; then
    echo "Error: Static Web App name '$APP_NAME' is already taken"
    echo "Please choose a different name or delete the existing app"
    exit 1
fi
echo "✓ Name '$APP_NAME' is available"
echo ""

# Create resource group if it doesn't exist
echo "Creating resource group (if not exists)..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || true

# Create Static Web App
echo "Creating Static Web App..."
az staticwebapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Free \
    --output none

# Get deployment token
echo ""
echo "=== Deployment Token ==="
echo "Add this as a GitHub secret named AZURE_STATIC_WEB_APPS_API_TOKEN:"
echo ""
az staticwebapp secrets list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" \
    --output tsv

echo ""
echo "=== Next Steps ==="
echo "1. Copy the deployment token above"
echo "2. Go to your GitHub repo -> Settings -> Secrets -> Actions"
echo "3. Create a new secret named: AZURE_STATIC_WEB_APPS_API_TOKEN"
echo "4. Paste the deployment token as the value"
echo "5. Push to main branch to trigger deployment"
echo ""
echo "To configure GitHub OAuth, run:"
echo "  ./configure-github-oauth.sh <github-client-id> <github-client-secret>"
