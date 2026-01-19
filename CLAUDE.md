# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cronflora is a GitHub-integrated document editor - a React SPA that allows users to edit files directly in a GitHub repository through Azure Static Web Apps with GitHub OAuth authentication.

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

API commands run from `swa-site/api/` directory:

```bash
npm install              # Install dependencies
npm run build            # Build TypeScript
npm run typecheck        # TypeScript check only
npm start                # Run Azure Functions locally
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
3. `useConfig` hook reads repo/file config from `VITE_*` environment variables
4. Frontend calls `/api/getFile` and `/api/saveFile` endpoints (Azure Functions)
5. Azure Functions validate `x-ms-client-principal` header and call GitHub API using server-side PAT

### Source Structure (`swa-site/src/`)
- `App.tsx` - Main component, orchestrates state and data flow
- `components/` - MenuBar, Editor (textarea with line numbers), SearchReplace modal
- `hooks/` - `useAuth.ts` (authentication state), `useConfig.ts` (env config)
- `services/github.ts` - Calls `/api/*` endpoints (Azure Functions backend)
- `types.ts` - TypeScript interfaces (UserInfo, AppConfig)

### Azure Functions API (`swa-site/api/`)
- `src/functions/getFile.ts` - GET /api/getFile - Fetch file from GitHub
- `src/functions/saveFile.ts` - POST /api/saveFile - Save file to GitHub
- `src/shared/auth.ts` - Client principal parsing and validation
- `src/shared/github.ts` - GitHub API utilities (server-side)

### Azure SWA Configuration
- `staticwebapp.config.json` - Routes, auth config, security headers
- `swa-cli.config.json` - Local dev settings for SWA CLI
- Auth endpoint: `/.auth/login/github`, session at `/.auth/me`
- GitHub OAuth scope: `repo` (full repository access)

### Infrastructure (`swa-site/infra/`)
- `deploy.sh` - Create Azure SWA resource
- `configure-github-oauth.sh` - Set OAuth credentials in Azure
- `configure-github-pat.sh` - Set GitHub PAT for API backend (server-side only)
- `status.sh` - Check deployment and configuration status
- `destroy.sh` - Delete Azure resources

## Environment Variables

Create `.env.local` in `swa-site/` (see `.env.example`):
```
VITE_GITHUB_OWNER=your-github-username
VITE_GITHUB_REPO=cronflora
VITE_GITHUB_BRANCH=main
VITE_DOCUMENT_PATH=dokumenttiprojekti/cornflora/todo.md
```

For local SWA CLI auth simulation, also add:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

For local API development, create `api/local.settings.json` (see `api/local.settings.json.example`):
```json
{
  "Values": {
    "GITHUB_PAT": "ghp_your_personal_access_token"
  }
}
```

## CI/CD

GitHub Actions workflow at `.github/workflows/azure-swa-site.yml` builds and deploys to Azure on push to main. Requires `AZURE_STATIC_WEB_APPS_API_TOKEN` secret.
