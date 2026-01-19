#!/bin/bash

# Destroy Azure Static Web App resources
# Usage: ./destroy.sh [resource-group]

set -e

RESOURCE_GROUP=${1:-"rg-cronflora-swa-site"}

echo "=== Destroying Azure Resources ==="
echo "Resource Group: $RESOURCE_GROUP"
echo ""

read -p "Are you sure you want to delete the resource group '$RESOURCE_GROUP'? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "Aborted."
    exit 0
fi

# Check if logged in to Azure
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure first: az login"
    exit 1
}

echo "Deleting resource group..."
az group delete \
    --name "$RESOURCE_GROUP" \
    --yes \
    --no-wait

echo ""
echo "Resource group deletion initiated (running in background)."
echo "Use 'az group show --name $RESOURCE_GROUP' to check status."
