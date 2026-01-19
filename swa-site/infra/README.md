# Infrastructure Scripts

Azure CLI scripts for managing the Static Web App.

## Prerequisites

- Azure CLI installed (`az`)
- Logged in to Azure (`az login`)
- Appropriate permissions to create resources

## Scripts

### deploy.sh

Creates the Azure Static Web App and outputs the deployment token.

```bash
./deploy.sh [resource-group] [app-name] [location]

# Defaults:
#   resource-group: rg-cronflora-swa-site
#   app-name: swa-document-editor
#   location: westeurope
```

### configure-github-oauth.sh

Configures GitHub OAuth authentication.

```bash
./configure-github-oauth.sh <github-client-id> <github-client-secret> [resource-group] [app-name]
```

### destroy.sh

Deletes the resource group and all resources.

```bash
./destroy.sh [resource-group]
```

## Setup Steps

1. **Create Azure Resources**
   ```bash
   cd infra
   chmod +x *.sh
   ./deploy.sh
   ```

2. **Configure GitHub Secret**
   - Copy the deployment token from the output
   - Go to GitHub repo → Settings → Secrets → Actions
   - Create secret: `AZURE_STATIC_WEB_APPS_API_TOKEN`

3. **Create GitHub OAuth App**
   - Go to https://github.com/settings/developers
   - Create **TWO** separate OAuth Apps (one for local dev, one for production)
   
   **Production OAuth App:**
   - Application name: `CronFlora Production` (or similar)
   - Homepage URL: `https://<your-app>.azurestaticapps.net`
   - Authorization callback URL: `https://<your-app>.azurestaticapps.net/.auth/login/github/callback`
   - Enable Device Flow: **NO**
   - Required scopes: `repo` (set in staticwebapp.config.json)
   

4. **Configure OAuth in Azure**
   
   Option A - Using the script with .env file:
   ```bash
   # Update infra/.env with production OAuth credentials
   cd infra
   source .env
   ./configure-github-oauth.sh $GITHUB_CLIENT_ID $GITHUB_CLIENT_SECRET
   ```
   
   Option B - Direct command:
   ```bash
   ./configure-github-oauth.sh <production-client-id> <production-client-secret>
   ```

5. **Deploy**
   - Push to main branch to trigger GitHub Actions
