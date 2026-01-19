#!/bin/bash
# Set GitHub repository secrets for Static Web App build-time environment variables
# Reads values from ../.env file

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env file not found at $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a


if [ -z "$VITE_GITHUB_OWNER" ]; then
  echo "❌ Error: VITE_GITHUB_OWNER not set in .env"
  exit 1
fi

if [ -z "$VITE_GITHUB_REPO" ]; then
  echo "❌ Error: VITE_GITHUB_REPO not set in .env"
  exit 1
fi

if [ -z "$VITE_GITHUB_BRANCH" ]; then
  echo "❌ Error: VITE_GITHUB_BRANCH not set in .env"
  exit 1
fi

if [ -z "$VITE_DOCUMENT_PATH" ]; then
  echo "❌ Error: VITE_DOCUMENT_PATH not set in .env"
  exit 1
fi

echo "$VITE_GITHUB_OWNER" | gh secret set VITE_GITHUB_OWNER
echo "$VITE_GITHUB_REPO" | gh secret set VITE_GITHUB_REPO
echo "$VITE_GITHUB_BRANCH" | gh secret set VITE_GITHUB_BRANCH
echo "$VITE_DOCUMENT_PATH" | gh secret set VITE_DOCUMENT_PATH
