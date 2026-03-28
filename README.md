# EchoLabs

EchoLabs is a real-time presentation HUD built with Next.js. It captures live speech, streams transcripts, grounds context and references against workspace-owned data, and renders structured artifacts like charts and summaries while you present.

The current codebase includes:

- Workspace-scoped auth and BYOK credential storage
- Grounded context and references with provenance
- Structured chart generation instead of model-generated Mermaid
- SSE-first live event delivery with WebSocket compatibility
- A custom Next.js server for `/ws` upgrades

## Documentation

- [Architecture Guide](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/docs/architecture.md)
- [Deployment Guide](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/docs/deployment.md)

## Requirements

- Node.js 22+
- npm 10+

Node 22 is recommended because the workspace/auth store currently uses Node's built-in `node:sqlite` module.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy the env template and fill in real values:

```bash
cp .env.example .env
```

3. Start the app with the custom server:

```bash
npm run dev:ws
```

4. Open the app:

```text
http://localhost:3000
```

5. Create a session at `/login`, then open `/app`.

6. Add workspace credentials at `/app/settings`.

## Environment Variables

Required for the core app:

- `APP_ENCRYPTION_KEY`: encrypts workspace provider secrets at rest
- `GEMINI_API_KEY`: optional fallback Gemini key outside production
- `DEEPGRAM_API_KEY`: optional fallback Deepgram key outside production
- `DEEPGRAM_PROJECT_ID`: required for minting short-lived browser Deepgram tokens

Useful optional settings:

- `PORT`: server port, defaults to `3000`
- `HOSTNAME`: server hostname, defaults to `localhost`
- `ECHOLENS_DATA_FILE`: path for the SQLite foundation store
- `ALLOW_DEMO_CREDENTIALS=true`: allows env fallback credentials in production-like environments
- `DEMO_MODE=keynote|corporate`: enables demo content modes for local work

## Scripts

- `npm run dev`: Next.js dev server
- `npm run dev:ws`: custom dev server with WebSocket support
- `npm run build`: production build
- `npm run start`: production custom server
- `npm run test`: Vitest suite
- `npm run lint`: ESLint
- `npm run demo`: demo transcript driver
- `npm run demo:corporate`: corporate demo transcript driver
- `npm run keynote`: keynote transcript driver

## Product Flow

1. A presenter signs in with the lightweight workspace session flow at `/login`.
2. The active workspace is stored server-side and attached to a signed cookie.
3. Provider credentials are saved per workspace from `/app/settings`.
4. The client streams microphone input through Deepgram using a short-lived browser token.
5. The orchestrator runs a deterministic pipeline over transcript text:
   retrieve context, find references, generate summaries, and build charts.
6. Results are emitted as session events and rendered live as a presentation HUD.

## Core Paths

- App shell: [src/app/app/page.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/app/page.tsx)
- Login: [src/app/login/page.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/login/page.tsx)
- Workspace settings: [src/components/workspace/workspace-settings-panel.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/workspace/workspace-settings-panel.tsx)
- Orchestrator: [src/services/orchestrator/orchestrator.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/orchestrator/orchestrator.service.ts)
- Auth/workspaces: [src/server/foundation/repository.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/repository.ts)
- Event fanout: [src/server/session-events.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/session-events.ts)

## Current Persistence Model

Workspace, session, credential, and source metadata are stored in a local SQLite file through [src/server/foundation/store.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/store.ts).

This is good enough for local development and single-instance deployment, but it is not the final scale-out persistence layer. For multi-instance Cloud Run or broader production rollout, the next recommended step is replacing that store with Postgres while keeping the same repository interfaces.

## Verification Status

The app build path currently passes with:

```bash
npm run build
```

Some upstream lint and test suites outside the core EchoLabs HUD path still need cleanup, especially around newer CRM and Mastra modules. If you are shipping the current presentation HUD flow, build verification is the most reliable gate right now.
