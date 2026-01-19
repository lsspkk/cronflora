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
#   resource-group: rg-swa-site
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
   - Create new OAuth App
   - Set callback URL: `https://<your-app>.azurestaticapps.net/.auth/login/github/callback`

4. **Configure OAuth in Azure**
   ```bash
   ./configure-github-oauth.sh <client-id> <client-secret>
   ```

5. **Deploy**
   - Push to main branch to trigger GitHub Actions
