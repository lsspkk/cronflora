#!/bin/bash

# Azure Static Web App Budget Management Script
#
# === HOW TO KEEP AZURE STATIC WEB APPS MOSTLY FREE ===
#
# Azure Static Web Apps Free Tier Includes:
# - 100 GB bandwidth per month
# - 0.5 GB storage
# - Custom domains and SSL certificates
# - Authentication (GitHub, Azure AD, Twitter, etc.)
# - Staging environments (3 per app)
# - No cost for hosting static content
#
# Tips to Stay Within Free Tier:
# 1. Use the Free SKU (not Standard) - already set in deploy.sh
# 2. Optimize assets: compress images, minify CSS/JS
# 3. Use browser caching to reduce bandwidth
# 4. Monitor bandwidth usage - main cost driver if exceeded
# 5. Use CDN caching headers properly
# 6. Avoid excessive API calls if using Azure Functions backend
# 7. Delete unused staging environments
# 8. Monitor costs regularly with this script
#
# Note: The Free tier should be sufficient for most documentation/portfolio sites.
# Only upgrade to Standard if you need:
# - More than 100 GB bandwidth/month
# - Custom SLA
# - Private endpoints
#
# =============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

BUDGET_NAME="budget-${RESOURCE_GROUP}"
BUDGET_AMOUNT=20
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

echo "=== Azure Budget and Cost Analysis ==="
echo "Resource Group: $RESOURCE_GROUP"
echo "Subscription ID: $SUBSCRIPTION_ID"
echo ""

# Check if logged in to Azure
echo "Checking Azure login status..."
az account show > /dev/null 2>&1 || {
    echo "Please login to Azure first: az login"
    exit 1
}

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP" > /dev/null 2>&1; then
    echo "Error: Resource group '$RESOURCE_GROUP' does not exist"
    exit 1
fi

# Check if budget exists, if not create it
echo "Checking budget configuration..."
BUDGET_EXISTS=$(az consumption budget list --resource-group "$RESOURCE_GROUP" --query "[?name=='$BUDGET_NAME'].name" -o tsv 2>/dev/null || echo "")

if [ -z "$BUDGET_EXISTS" ]; then
    echo "Budget not found. Creating budget: \$$BUDGET_AMOUNT per month..."
    
    # Get the first day of next month for budget start
    START_DATE=$(date -d "$(date +%Y-%m-01) +1 month" +%Y-%m-%d)
    END_DATE="2030-12-31"  # Far future date
    
    # Create budget
    az consumption budget create \
        --resource-group "$RESOURCE_GROUP" \
        --budget-name "$BUDGET_NAME" \
        --amount "$BUDGET_AMOUNT" \
        --time-grain Monthly \
        --start-date "$START_DATE" \
        --end-date "$END_DATE" \
        --category Cost \
        --output none 2>/dev/null || {
            echo "Note: Budget creation requires Contributor or Owner role on the subscription"
            echo "You can create budgets manually in Azure Portal: Cost Management + Billing"
        }
    
    echo "✓ Budget set to \$$BUDGET_AMOUNT per month"
else
    echo "✓ Budget already exists: $BUDGET_NAME"
fi

echo ""
echo "=== Cost Analysis - Last 6 Months ==="
echo ""

# Get costs for the last 6 months
END_DATE=$(date +%Y-%m-%d)
START_DATE=$(date -d "6 months ago" +%Y-%m-%d)

echo "Period: $START_DATE to $END_DATE"
echo ""

# Get actual costs by month
echo "Monthly costs breakdown:"
az consumption usage list \
    --start-date "$START_DATE" \
    --end-date "$END_DATE" \
    --query "[?contains(instanceId, '$RESOURCE_GROUP')].{Date:usageStart, Cost:pretaxCost, Currency:currency}" \
    --output table 2>/dev/null || {
        # Fallback to cost management query if consumption API doesn't work
        echo "Fetching cost data using Cost Management API..."
        az costmanagement query \
            --type Usage \
            --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
            --timeframe Custom \
            --time-period from="$START_DATE" to="$END_DATE" \
            --dataset-granularity Monthly \
            --dataset-aggregation totalCost=Sum PreTaxCost \
            --query "rows[*].[0,1]" \
            --output table 2>/dev/null || {
                echo "Note: Unable to fetch detailed cost data"
                echo "You may need 'Cost Management Reader' role"
                echo "View costs in Azure Portal: Cost Management + Billing -> Cost Analysis"
            }
    }

echo ""
echo "=== Current Month Status ==="

# Try to get current month's costs
CURRENT_MONTH_START=$(date +%Y-%m-01)
CURRENT_DATE=$(date +%Y-%m-%d)

az costmanagement query \
    --type ActualCost \
    --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
    --timeframe Custom \
    --time-period from="$CURRENT_MONTH_START" to="$CURRENT_DATE" \
    --dataset-granularity None \
    --dataset-aggregation totalCost=Sum Cost \
    --query "rows[0][0]" \
    --output tsv 2>/dev/null | while read -r cost; do
        if [ -n "$cost" ] && [ "$cost" != "null" ]; then
            printf "Current month cost so far: \$%.2f\n" "$cost"
            printf "Budget for month: \$%d.00\n" "$BUDGET_AMOUNT"
            
            # Calculate percentage
            PERCENTAGE=$(echo "scale=1; ($cost / $BUDGET_AMOUNT) * 100" | bc 2>/dev/null || echo "N/A")
            if [ "$PERCENTAGE" != "N/A" ]; then
                printf "Budget used: %.1f%%\n" "$PERCENTAGE"
            fi
        else
            echo "Current month cost: \$0.00 (or data not yet available)"
        fi
    done 2>/dev/null || echo "Cost data for current month not yet available"

echo ""
echo "=== Summary ==="
echo "✓ Resource group: $RESOURCE_GROUP"
echo "✓ Monthly budget limit: \$$BUDGET_AMOUNT"
echo "✓ Free tier includes 100 GB bandwidth/month - monitor to stay free"
echo ""
echo "To view detailed cost analysis:"
echo "  Azure Portal -> Cost Management + Billing -> Cost Analysis"
echo "  Filter by Resource Group: $RESOURCE_GROUP"
echo ""
