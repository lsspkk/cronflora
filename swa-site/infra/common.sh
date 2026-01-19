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

export RESOURCE_GROUP
export APP_NAME
export LOCATION
export GITHUB_CLIENT_ID
export GITHUB_CLIENT_SECRET
