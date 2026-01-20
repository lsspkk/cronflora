#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

source "$ENV_FILE"

if [ -z "$RESOURCE_GROUP" ] || [ -z "$APP_NAME" ] || [ -z "$LOCATION" ]; then
    echo "Error: RESOURCE_GROUP, APP_NAME, and LOCATION must be set in .env"
    exit 1
fi

export RESOURCE_GROUP APP_NAME LOCATION
export GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET GITHUB_PAT
export CRONFLORA_GITHUB_OWNER CRONFLORA_GITHUB_REPO CRONFLORA_GITHUB_BRANCH CRONFLORA_CONFIG_PATH
