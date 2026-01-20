# Document Editor

A simple document editor built with React, TypeScript, and Tailwind CSS. Deployed as an Azure Static Web App with GitHub OAuth authentication.

## Local Development

1. Create a GitHub OAuth App at https://github.com/settings/developers with homepage `http://localhost:4280` and callback `http://localhost:4280/.auth/login/github/callback`
2. Copy `.env.example` to `.env.local` and add your `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
3. Copy `api2/local.settings.json.example` to `api2/local.settings.json` and configure your `GITHUB_PAT` and `CRONFLORA_*` variables
4. Run `npm install` in both `swa-site/` and `swa-site/api2/`
5. Start with `./infra/start-local.sh` or manually with `npm run dev` (API) and `npm run dev:swa` (frontend)
6. Access at http://localhost:4280 (port 5173 won't have auth)

For deployment, use the scripts in `infra/` folder


## Security & Authentication Overview

This app uses **Azure Static Web Apps built-in authentication** with **GitHub OAuth**. Users authenticate via GitHub, and Azure manages the OAuth2 flow and session. After login, Azure manages the authenticated session. The authoritative user identity is provided to backend APIs through the injected `x-ms-client-principal` header, while the `/.auth/me` endpoint is available to the frontend for informational and UI purposes only.


**Important:** Azure SWA does NOT expose OAuth access tokens to the frontend. The GitHub API requires an access token, so we use a **Managed Azure Function** as a secure backend proxy.

## Production Architecture

```
User → GitHub OAuth (Azure SWA) → Session Cookie
                                        ↓
Frontend (authenticated) → /api/getFile, /api/saveFile
                                        ↓
              Azure Function (x-ms-client-principal header injected by Azure)
                                        ↓
              GitHub API (using server-side PAT - never exposed to browser)
```

**Why this architecture:**

1. Azure SWA authenticates users and issues a session cookie
2. Frontend calls `/api/*` endpoints - Azure automatically validates the session
3. Azure injects `x-ms-client-principal` header (Base64 user info) - **cannot be forged by client**
4. Azure Function verifies user is authenticated, then calls GitHub API using a server-side PAT
5. The PAT is stored as an Azure app setting (without `VITE_` prefix) - never in frontend code

**Security guarantees:**
- Only authenticated users can call `/api/*` (enforced by Azure infrastructure)
- User identity is guaranteed by Azure - the `x-ms-client-principal` header is injected server-side
- GitHub PAT stays server-side, never exposed to the browser
- No tokens in frontend JavaScript bundle


### Additional Security & Operational Notes

- Access to `/api/*` endpoints **must be explicitly restricted** to authenticated users using `staticwebapp.config.json` (e.g. `allowedRoles: ["authenticated"]`). Authentication is not implicit without this configuration.
- Azure Functions **must validate the presence and contents** of the injected `x-ms-client-principal` header and reject requests where it is missing or invalid.
- The GitHub Personal Access Token represents a **shared application identity**: all GitHub API operations are performed as the PAT owner, not as the individual end user.
- The `/.auth/me` endpoint is intended for UI and debugging only and **must not be used as a security boundary**.
- Azure Static Web Apps and Azure Functions currently fit within free/consumption tiers for low usage, but **cost is subject to Azure pricing and quota changes**.


## Blunt Security Summary

- **Auth provider:** GitHub OAuth via Azure Static Web Apps  
- **Frontend tokens:** None - no secrets in browser  
- **API authentication:** Azure session cookie + `x-ms-client-principal` header (injected by Azure)  
- **GitHub access:** Server-side PAT in Azure Function (stored in app settings)  
- **Token exposure risk:** Eliminated - PAT never sent to browser  
- **User verification:** Azure infrastructure guarantees identity via injected header  
- **Trust model:** User must authenticate via GitHub, then Azure Function authorizes GitHub API calls  
- **Cost:** Free tier - Managed Azure Functions included in SWA Free plan  

## Official Documentation

- Azure Static Web Apps auth: https://learn.microsoft.com/azure/static-web-apps/authentication-authorization
- Azure SWA user info & tokens: https://learn.microsoft.com/azure/static-web-apps/user-information
- GitHub OAuth overview: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- OAuth 2.0 (general): https://en.wikipedia.org/wiki/OAuth


