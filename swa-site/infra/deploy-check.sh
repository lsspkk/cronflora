#!/bin/bash

# Azure Static Web App Deployment Check Script
# This script pulls detailed deployment failure information from Azure
# (not just the high-level GitHub Actions status)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

echo "=== Azure Static Web App Deployment Check ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo ""

# Check if logged in to Azure
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure first: az login"
    exit 1
}

# Check if app exists
echo "Checking if app exists..."
APP_EXISTS=$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query name -o tsv 2>/dev/null || echo "")
if [ -z "$APP_EXISTS" ]; then
    echo "✗ Static Web App '$APP_NAME' not found in resource group '$RESOURCE_GROUP'"
    exit 1
fi
echo "✓ App exists"
echo ""

# Get app settings (including FUNCTIONS_NODE_VERSION)
echo "=== App Settings ==="
az staticwebapp appsettings list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties" \
    -o json | jq -r 'to_entries | .[] | "\(.key) = \(.value)"' 2>/dev/null || {
    echo "No custom app settings found (or jq not installed)"
}
echo ""

# Get deployment history
echo "=== Recent Deployments (last 5) ==="
az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "{defaultHostname:defaultHostname,sku:sku.name,location:location}" \
    -o table

echo ""
echo "Fetching build history from Azure..."

# Get builds/environments - this shows deployment status
az rest \
    --method GET \
    --url "$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv)/builds?api-version=2022-09-01" \
    --query "value[0:5].{buildId:buildId,status:status,lastUpdatedOn:lastUpdatedOn,buildConfig:buildConfig}" \
    -o table 2>/dev/null || {
        echo "⚠ Could not fetch detailed build history"
        echo "This may require newer Azure CLI version or specific permissions"
    }

echo ""
echo "=== Latest Deployment Details ==="

# Get the latest deployment/build details with more info
LATEST_BUILD=$(az rest \
    --method GET \
    --url "$(az staticwebapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv)/builds?api-version=2022-09-01" \
    --query "value[0]" \
    -o json 2>/dev/null || echo "{}")

if [ "$LATEST_BUILD" != "{}" ] && [ "$LATEST_BUILD" != "null" ]; then
    echo "$LATEST_BUILD" | jq '{
        buildId: .buildId,
        status: .status,
        lastUpdatedOn: .lastUpdatedOn,
        userProvidedFunctionAppName: .userProvidedFunctionAppName,
        apiProperties: .properties
    }' 2>/dev/null || echo "$LATEST_BUILD"
else
    echo "No build information available via Azure API"
fi

echo ""
echo "=== Application Insights Status ==="

# Check if Application Insights is configured
APP_INSIGHTS_KEY=$(az staticwebapp appsettings list \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.APPINSIGHTS_INSTRUMENTATIONKEY" \
    -o tsv 2>/dev/null || echo "")

if [ -z "$APP_INSIGHTS_KEY" ] || [ "$APP_INSIGHTS_KEY" = "null" ]; then
    echo "⚠ Application Insights is NOT configured"
    echo ""
    echo "To enable detailed runtime logs and diagnostics:"
    echo "1. Create Application Insights:"
    echo "   az monitor app-insights component create \\"
    echo "     --app ${APP_NAME}-insights \\"
    echo "     --location $LOCATION \\"
    echo "     --resource-group $RESOURCE_GROUP"
    echo ""
    echo "2. Get the instrumentation key:"
    echo "   INSIGHTS_KEY=\$(az monitor app-insights component show \\"
    echo "     --app ${APP_NAME}-insights \\"
    echo "     --resource-group $RESOURCE_GROUP \\"
    echo "     --query instrumentationKey -o tsv)"
    echo ""
    echo "3. Configure it for the SWA:"
    echo "   az staticwebapp appsettings set \\"
    echo "     --name $APP_NAME \\"
    echo "     --resource-group $RESOURCE_GROUP \\"
    echo "     --setting-names \"APPINSIGHTS_INSTRUMENTATIONKEY=\$INSIGHTS_KEY\""
else
    echo "✓ Application Insights is configured"
    echo "Instrumentation Key: ${APP_INSIGHTS_KEY:0:8}..."
    echo ""
    echo "To view logs:"
    echo "  az monitor app-insights query \\"
    echo "    --app ${APP_NAME}-insights \\"
    echo "    --resource-group $RESOURCE_GROUP \\"
    echo "    --analytics-query \"traces | where timestamp > ago(1h) | order by timestamp desc | take 50\""
fi

echo ""
echo "=== GitHub Actions Workflow Status ==="
echo "To see GitHub Actions logs:"
echo "  gh run list --limit 5"
echo "  gh run view <run-id>"
echo ""

echo "=== Troubleshooting Tips ==="
echo "1. Check the deployment status above"
echo "2. Review GitHub Actions logs: gh run view --log-failed"
echo "3. Enable Application Insights for detailed runtime logs"
echo "4. Check function app settings (Node version, etc.)"
echo "5. Verify staticwebapp.config.json is valid"
echo ""
echo "Common Issues:"
echo "- FUNCTIONS_NODE_VERSION not set to ~20 (for @azure/functions@4.11+)"
echo "- Missing or invalid staticwebapp.config.json"
echo "- API folder structure incorrect (should be api/ with host.json)"
echo "- Package.json engines field not matching runtime"
echo ""

# Try to get more details from ARM/resource provider
echo "=== Azure Resource Status ==="
az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "{
        provisioningState:provisioningState,
        repositoryUrl:repositoryUrl,
        branch:branch,
        stagingEnvironments:stagingEnvironmentPolicy,
        allowConfigFileUpdates:allowConfigFileUpdates
    }" \
    -o table

echo ""
echo "For the most detailed deployment logs:"
echo "  Azure Portal -> Static Web Apps -> $APP_NAME -> Environments -> Production -> View logs"
