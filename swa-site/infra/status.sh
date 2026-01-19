#!/bin/bash

# Azure Static Web App Status Script
# Usage: ./status.sh [resource-group] [app-name]

set -e

RESOURCE_GROUP=${1:-"rg-cronflora-swa-site"}
APP_NAME=${2:-"swa-document-editor"}

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
    
else
    echo "❌ Static Web App not found: $APP_NAME"
    exit 1
fi

echo ""
echo "=== Summary ==="
echo "Website URL: https://$SWA_URL"
