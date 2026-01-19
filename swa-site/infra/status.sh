#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "=== Azure Static Web App Status ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo ""

# Check if logged in to Azure
az account show > /dev/null 2>&1 || {
    echo "❌ Please login to Azure first: az login"
    exit 1
}

echo "✓ Azure CLI logged in"
echo ""

# Check if resource group exists
echo "Checking resource group..."
if az group show --name "$RESOURCE_GROUP" > /dev/null 2>&1; then
    RG_LOCATION=$(az group show --name "$RESOURCE_GROUP" --query location -o tsv)
    echo "✓ Resource group exists: $RESOURCE_GROUP (Location: $RG_LOCATION)"
else
    echo "❌ Resource group not found: $RESOURCE_GROUP"
    exit 1
fi
echo ""

# Check if Static Web App exists
echo "Checking Static Web App..."
if az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" > /dev/null 2>&1; then
    echo "✓ Static Web App exists: $APP_NAME"
    
    # Get SWA details
    SWA_URL=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query defaultHostname -o tsv)
    
    SWA_STATUS=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query properties.provisioningState -o tsv 2>/dev/null || echo "Unknown")
    
    SWA_SKU=$(az staticwebapp show \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query sku.name -o tsv 2>/dev/null || echo "Unknown")
    
    echo ""
    echo "=== Static Web App Details ==="
    echo "Name: $APP_NAME"
    echo "Status: $SWA_STATUS"
    echo "SKU: $SWA_SKU"
    echo "URL: https://$SWA_URL"
    echo ""
    
    # Check if the site is responding
    echo "Testing website availability..."
    if curl -s -o /dev/null -w "%{http_code}" "https://$SWA_URL" | grep -q "200\|301\|302"; then
        echo "✓ Website is responding"
    else
        echo "⚠ Website may not be fully deployed yet"
    fi
    
    # Check GitHub OAuth configuration
    echo ""
    echo "Checking GitHub OAuth configuration..."
    GITHUB_CLIENT_ID_SET=$(az staticwebapp appsettings list \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.GITHUB_CLIENT_ID" -o tsv 2>/dev/null)

    if [ -z "$GITHUB_CLIENT_ID_SET" ] || [ "$GITHUB_CLIENT_ID_SET" == "null" ]; then
        echo "❌ GitHub OAuth not configured"
        echo "   Run: ./configure-github-oauth.sh"
    else
        echo "✓ GitHub OAuth configured"
    fi

    # Check GitHub PAT configuration (for Azure Functions backend)
    echo ""
    echo "Checking GitHub PAT configuration (for API backend)..."
    GITHUB_PAT_SET=$(az staticwebapp appsettings list \
        --name "$APP_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.FUNCTIONS_API_GITHUB_PAT" -o tsv 2>/dev/null)

    if [ -z "$GITHUB_PAT_SET" ] || [ "$GITHUB_PAT_SET" == "null" ]; then
        echo "❌ GitHub PAT not configured"
        echo "   Run: ./configure-github-pat.sh <your-github-pat>"
        echo "   Or set FUNCTIONS_API_GITHUB_PAT in .env and run: ./configure-github-pat.sh"
        echo "   Create PAT at: https://github.com/settings/tokens/new (scope: repo)"
    else
        echo "✓ GitHub PAT configured (server-side only)"
    fi

    # Check Azure Functions API
    echo ""
    echo "Checking API endpoints..."
    API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "https://$SWA_URL/api/getFile" 2>/dev/null || echo "000")
    if [ "$API_RESPONSE" == "401" ]; then
        echo "✓ API endpoints responding (returns 401 for unauthenticated requests as expected)"
    elif [ "$API_RESPONSE" == "000" ]; then
        echo "⚠ API endpoints not reachable (may need deployment)"
    else
        echo "⚠ API endpoint returned status: $API_RESPONSE"
    fi

else
    echo "❌ Static Web App not found: $APP_NAME"
    exit 1
fi

echo ""
echo "=== Summary ==="
echo "Website URL: https://$SWA_URL"
echo ""
echo "=== Architecture ==="
echo "Frontend → Azure SWA (session cookie) → /api/* → Azure Functions → GitHub API"
echo "                                                         ↓"
echo "                                              GITHUB_PAT (server-side only)"
