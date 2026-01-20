# Vanilla Static Web App

Minimal hello world Static Web App with API.
Use this to make sure that your SWA/Azure frontend + API setup is working.

## Structure
- `index.html` - Simple hello world page
- `api/` - Azure Functions API

## Deploy
1. Enable the workflow in `.github/workflows/azure-static-web-apps.yml` (change `if: false` to `if: true`)
2. Add `AZURE_STATIC_WEB_APPS_API_TOKEN` secret to GitHub repository
3. Push to main branch

## Local Development
```bash
# Serve static files (from vanilla/ directory)
npx serve

# Or use Azure Static Web Apps CLI
npx @azure/static-web-apps-cli start
```
