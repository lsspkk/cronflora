# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cronflora is a GitHub-integrated document editor - a React SPA that allows users to edit multiple files in a GitHub repository through Azure Static Web Apps with GitHub OAuth authentication.

## Build and Development Commands

Frontend commands run from `swa-site/` directory:

```bash
npm install              # Install dependencies
npm run dev              # Vite dev server at http://localhost:5173
npm run dev:swa          # Full Azure SWA simulation at http://localhost:4280 (use this for auth testing)
npm run typecheck        # TypeScript type check only (fast)
npm run build            # TypeScript check + production build (tsc -b && vite build)
npm run preview          # Preview production build
```

API commands run from `swa-site/api2/` directory:

```bash
npm install              # Install dependencies
npm run build            # Build TypeScript
npm run typecheck        # TypeScript check only
npm run dev              # Build and run Azure Functions locally
npm start                # Run Azure Functions (requires prior build)
```

Local development with both frontend and API:
```bash
./swa-site/infra/start-local.sh   # Starts both API and SWA with hot reload
```

**Note:** No test framework or linter is configured.

## Architecture

### Tech Stack
- React 19 with TypeScript (strict mode)
- Vite for builds
- Tailwind CSS 4 for styling
- Azure Static Web Apps for hosting and OAuth
- GitHub REST API for file operations

### Key Flow
1. User authenticates via GitHub OAuth (managed by Azure SWA)
2. `useAuth` hook fetches session from `/.auth/me` endpoint (identity only, no tokens)
3. `useRepoConfig` hook fetches document config from `/api/getConfig` with localStorage caching (24-hour expiry)
4. Frontend calls `/api/getFile` and `/api/saveFile` endpoints (Azure Functions)
5. Azure Functions validate `x-ms-client-principal` header and call GitHub API using server-side PAT

### Source Structure (`swa-site/src/`)
- `App.tsx` - Main component, orchestrates state and multi-file editing
- `components/` - MenuBar, Editor, SearchReplace, FileDropdown, DarkModeIcon
- `hooks/` - `useAuth.ts` (authentication), `useRepoConfig.ts` (config with cache), `useDarkMode.ts` (theme)
- `services/github.ts` - Calls `/api/*` endpoints
- `services/storage.ts` - LocalStorage for config caching and last opened file
- `types.ts` - TypeScript interfaces (UserInfo, DocumentConfig, RepoConfig)

### Azure Functions API (`swa-site/api2/`)
- `src/functions/getConfig.ts` - GET /api/getConfig - Fetch document list from GitHub config file
- `src/functions/getFile.ts` - GET /api/getFile - Fetch file from GitHub
- `src/functions/saveFile.ts` - POST /api/saveFile - Save file to GitHub
- `src/shared/auth.ts` - Client principal parsing and validation
- `src/shared/config.ts` - `CRONFLORA_*` environment variable reader
- `src/shared/github.ts` - GitHub API utilities (server-side)

### Document Configuration
Config file stored in GitHub repo (path set via `CRONFLORA_CONFIG_PATH`):
```json
{
  "documents": [
    {"path": "path/to/file.md", "description": "File description", "name": "Display Name"}
  ]
}
```

### Azure SWA Configuration
- `staticwebapp.config.json` - Routes, auth config, security headers
- `swa-cli.config.json` - Local dev settings for SWA CLI
- Auth endpoint: `/.auth/login/github`, session at `/.auth/me`
- GitHub OAuth scope: `repo` (full repository access)

### Infrastructure (`swa-site/infra/`)
- `start-local.sh` - Start local dev environment with hot reload
- `deploy.sh` - Create Azure SWA resource
- `configure-github-oauth.sh` - Set OAuth credentials in Azure
- `configure-cronflora.sh` - Set CRONFLORA_* env vars in Azure
- `configure-github-pat.sh` - Set GitHub PAT for API backend
- `status.sh` - Check deployment and configuration status
- `destroy.sh` - Delete Azure resources

Configuration uses `.env` file (see `infra/.env.example`).

## Environment Variables

For local SWA CLI auth simulation, create `.env.local` in `swa-site/`:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

For local API development, create `api2/local.settings.json`:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "GITHUB_PAT": "ghp_your_personal_access_token",
    "CRONFLORA_GITHUB_OWNER": "your-github-username",
    "CRONFLORA_GITHUB_REPO": "cronflora",
    "CRONFLORA_GITHUB_BRANCH": "main",
    "CRONFLORA_CONFIG_PATH": "dokumenttiprojekti/cronflora-config.json"
  }
}
```

All `CRONFLORA_*` variables are server-side only (never exposed to browser).

## CI/CD

GitHub Actions workflow at `.github/workflows/azure-swa-site.yml` builds and deploys to Azure on push to main. Requires `AZURE_STATIC_WEB_APPS_API_TOKEN` secret.
