# Deployment Guide

## Recommended Target

Cloud Run is the best current deployment target for this repo because the app uses a custom Next.js server and still supports `/ws` upgrades through [server.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/server.ts).

## Runtime Requirements

- Node.js 22
- npm 10+
- A writable filesystem path for the local SQLite store if you use the default foundation store

## Environment Variables

### Required

- `APP_ENCRYPTION_KEY`
- `DEEPGRAM_PROJECT_ID`

### Usually needed

- `GEMINI_API_KEY`
- `DEEPGRAM_API_KEY`

### Optional

- `PORT`
- `HOSTNAME`
- `ECHOLENS_DATA_FILE`
- `ALLOW_DEMO_CREDENTIALS`
- `DEMO_MODE`

## Local Production Smoke Test

1. Install dependencies:

```bash
npm install
```

2. Build:

```bash
npm run build
```

3. Start the production server:

```bash
npm run start
```

4. Visit:

```text
http://localhost:3000
```

## Docker

This repo includes a production container at [Dockerfile](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/Dockerfile).

Build locally:

```bash
docker build -t echolens .
```

Run locally:

```bash
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e HOSTNAME=0.0.0.0 \
  -e APP_ENCRYPTION_KEY=replace-me \
  -e GEMINI_API_KEY=replace-me \
  -e DEEPGRAM_API_KEY=replace-me \
  -e DEEPGRAM_PROJECT_ID=replace-me \
  echolens
```

## Cloud Run

Deploy from source:

```bash
gcloud run deploy echolens \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

After deploy, set secrets or env vars for:

- `APP_ENCRYPTION_KEY`
- `GEMINI_API_KEY`
- `DEEPGRAM_API_KEY`
- `DEEPGRAM_PROJECT_ID`

## Storage Notes

By default, workspace/session/source data is persisted in a SQLite file managed by [src/server/foundation/store.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/store.ts).

That means:

- Local development works well
- Single-instance deployment is acceptable
- Multi-instance Cloud Run is not the final architecture

For broader production use, replace the foundation store with Postgres and keep the repository API stable.

## Auth and BYOK Setup After Deploy

1. Open `/login`
2. Create a user session and initial workspace
3. Open `/app/settings`
4. Save workspace-scoped `gemini` and `deepgram` credentials
5. Return to `/app` and verify the live presentation HUD starts receiving artifacts

## Demo Credentials Behavior

Fallback env credentials are only allowed outside production unless `ALLOW_DEMO_CREDENTIALS=true` is explicitly set. The logic lives in [src/server/foundation/providers.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/providers.ts).

## Verification

The most reliable pre-deploy gate right now is:

```bash
npm run build
```

Some broader lint and test failures still exist in newer upstream CRM and Mastra areas, so treat build success as the primary deployment gate until those modules are cleaned up.
