# Document Editor

A simple document editor built with React, TypeScript, and Tailwind CSS. Deployed as an Azure Static Web App.

## GitHub Integration

The app uses GitHub OAuth to authenticate users and the GitHub API to read/write files directly in the repository. Configure the target file path in `.env.local` (local development) or Azure app settings (production):

```
VITE_GITHUB_OWNER=your-username
VITE_GITHUB_REPO=cronflora
VITE_DOCUMENT_PATH=dokumenttiprojekti/cornflora/todo.md
```

## Setup

1. Copy `.env.example` to `.env.local` and fill in your GitHub details
2. Run `npm install` and `npm run dev`
3. For deployment, run scripts in `infra/` folder and configure GitHub OAuth in Azure


## Local Development with SWA CLI

Auth doesn't work locally because `/.auth/*` endpoints only exist on Azure.

## Setup

1. Create GitHub OAuth App at https://github.com/settings/developers
   - Homepage URL: `http://localhost:4280`
   - Callback URL: `http://localhost:4280/.auth/login/github/callback`
   - Enable Device Flow: **NO** (not needed for web apps)

2. Add credentials to `.env.local`:
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

3. Install and run:
   ```bash
   npm install
   npm run dev:swa
   ```

4. Access at `http://localhost:4280` (NOT port 5173)


## Security & Authentication Overview

This app uses **Azure Static Web Apps built-in authentication** with **GitHub OAuth**. Users authenticate via GitHub, and Azure manages the OAuth2 flow and session. After login, user identity and tokens are available via the `/.auth/me` endpoint. The app uses a **GitHub access token delegated to the logged-in user** to read and write files in a GitHub repository using the GitHub REST API.

Access tokens are **short-lived**, scoped to the user, and must be handled carefully on the client to avoid leakage. The app does not store long-lived secrets in the frontend codebase.

## Blunt Security Summary

- **Auth provider:** GitHub OAuth via Azure Static Web Apps  
- **Tokens used:** User-scoped GitHub OAuth access token  
- **Token location:** Retrieved at runtime from `/.auth/me` session  
- **Token usage:** GitHub REST API (read/write repository contents)  
- **Main risks:** Token exposure via XSS, overly broad GitHub scopes, leaked secrets  
- **Mitigations:** HTTPS only, minimal OAuth scopes, no persistent token storage, GitHub secrets for config  
- **Trust model:** User permissions == GitHub permissions  

## Official Documentation

- Azure Static Web Apps auth: https://learn.microsoft.com/azure/static-web-apps/authentication-authorization
- Azure SWA user info & tokens: https://learn.microsoft.com/azure/static-web-apps/user-information
- GitHub OAuth overview: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- OAuth 2.0 (general): https://en.wikipedia.org/wiki/OAuth


