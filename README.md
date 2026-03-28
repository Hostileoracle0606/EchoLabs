# EchoLabs

EchoLabs is a live presentation HUD.

It listens while you present, turns spoken points into structured visual artifacts, and helps you stay on top of your own material with grounded charts, references, context, and summaries. The goal is not to be a sales bot or a meeting copilot that talks over you. The goal is to make you sharper on stage.

If you are opening this repo for the first time, start here. This README is written for:

- a first-time reader who wants to understand what the product does
- an intern or new engineer who needs to run the app safely
- a teammate who needs to know where to look before changing code

## What EchoLabs Is

EchoLabs is a presentation support layer that sits beside a speaker and reacts to the presentation in real time.

Today, the app can:

- capture live speech from the browser
- stream transcripts through Deepgram
- generate structured charts from spoken data claims
- retrieve grounded references and context from workspace-owned sources
- build rolling summary bullets during a session
- render all of that as a live HUD in the app

## What EchoLabs Is Not

EchoLabs is not primarily:

- a sales assistant
- a CRM workflow engine
- a fully agentic autonomous operator
- a general-purpose chatbot

There are still older sales-oriented modules in the repo from earlier iterations. They are not the best entry point if you are trying to understand the current product direction. Start with the EchoLabs-specific app, workspace, and orchestrator paths instead.

## Current Product Shape

The current flow looks like this:

1. A user signs in at `/login`.
2. The server creates a workspace-backed session.
3. The user adds provider credentials in `/app/settings`.
4. The presenter speaks into the browser mic.
5. Deepgram provides live transcript data.
6. The orchestrator decides which artifact services to run.
7. The app renders structured charts, context hits, references, and summary bullets in real time.

## Repo Map

If you only read a handful of files, read these first:

- [src/app/app/page.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/app/page.tsx)
This is the authenticated app entrypoint.

- [src/components/layout/main-layout.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/layout/main-layout.tsx)
This is the main HUD UI.

- [src/components/controls/mic-button.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/controls/mic-button.tsx)
This is where browser recording and transcript posting are kicked off.

- [src/app/api/orchestrator/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/orchestrator/route.ts)
This is the server route that receives transcript chunks from the client.

- [src/services/orchestrator/orchestrator.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/orchestrator/orchestrator.service.ts)
This is the current deterministic orchestration pipeline.

- [src/server/foundation/repository.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/repository.ts)
This contains session, workspace, and credential operations.

- [src/server/foundation/store.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/store.ts)
This is the current SQLite-backed persistence layer.

- [src/server/session-events.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/session-events.ts)
This handles session-scoped live event fanout.

## Architecture At A Glance

There are five important layers:

1. Client UI
The app shell, landing page, HUD, and cards live under [src/components](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components).

2. Session and workspace foundation
Server-side auth, workspaces, memberships, credentials, and sources live under [src/server/foundation](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation).

3. Voice and transcript intake
Browser mic capture and transcript flow live in [src/hooks/use-deepgram.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/hooks/use-deepgram.ts), [src/components/controls/mic-button.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/controls/mic-button.tsx), and [src/app/api/deepgram/token/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/deepgram/token/route.ts).

4. Orchestration and artifact generation
The current pipeline triggers chart, context, reference, and summary generation from [src/services/orchestrator/orchestrator.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/orchestrator/orchestrator.service.ts).

5. Live delivery
The app primarily uses SSE for updates through [src/app/api/events/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/events/route.ts), while keeping `/ws` available through [server.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/server.ts) and [src/websocket/ws-server.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/websocket/ws-server.ts).

If you want the fuller version, read:

- [docs/architecture.md](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/docs/architecture.md)
- [docs/deployment.md](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/docs/deployment.md)

## How To Run The App

### Requirements

- Node.js 22+
- npm 10+

Node 22 matters because the current foundation store uses Node's built-in `node:sqlite`.

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Fill in the values in `.env`.

4. Start the custom dev server:

```bash
npm run dev:ws
```

5. Open:

```text
http://localhost:3000
```

6. Create a session at `/login`.

7. Add provider credentials at `/app/settings`.

### Why `dev:ws` instead of `dev`

`npm run dev` starts plain Next.js development mode.

`npm run dev:ws` starts the custom server in [server.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/server.ts), which is the right choice when you need the full app behavior, especially anything that depends on `/ws`.

## Environment Variables

The most important variables are:

- `APP_ENCRYPTION_KEY`
Used to encrypt workspace-scoped provider secrets at rest.

- `GEMINI_API_KEY`
Used as a fallback Gemini credential outside production unless a workspace-specific key is saved.

- `DEEPGRAM_API_KEY`
Used as a fallback Deepgram credential outside production unless a workspace-specific key is saved.

- `DEEPGRAM_PROJECT_ID`
Required to mint short-lived browser tokens for Deepgram.

Helpful optional variables:

- `PORT`
- `HOSTNAME`
- `ECHOLENS_DATA_FILE`
- `ALLOW_DEMO_CREDENTIALS`
- `DEMO_MODE`

See [.env.example](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/.env.example) for the current template.

## Common Commands

- `npm run dev`
- `npm run dev:ws`
- `npm run build`
- `npm run start`
- `npm run test`
- `npm run lint`
- `npm run demo`
- `npm run demo:corporate`
- `npm run keynote`

## How The Data Model Works

The foundation layer stores:

- users
- workspaces
- memberships
- sessions
- provider credentials
- connector connections
- sources
- source chunks

The type definitions live in [src/server/foundation/types.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/types.ts).

The implementation currently persists to a local SQLite file via [src/server/foundation/store.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/store.ts).

That means:

- local development is straightforward
- single-instance deployment is okay
- multi-instance production is not the final end state yet

If you are assigned a persistence task, the likely next step is replacing this store with Postgres while preserving the repository API.

## Grounding And Provenance

One of the important changes in this repo is that artifacts are no longer supposed to invent evidence.

Instead:

- references come from workspace-owned sources
- context matches come from stored source chunks
- chart artifacts carry structured payloads
- provenance metadata is pushed through the event layer

Good places to read:

- [src/services/reference/reference.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/reference/reference.service.ts)
- [src/services/context/context.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/context/context.service.ts)
- [src/server/foundation/sources.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/sources.ts)
- [src/types/events.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/types/events.ts)

## Charts

Business charts now use structured chart specs instead of raw model-generated Mermaid.

Read these together:

- [src/types/charts.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/types/charts.ts)
- [src/services/chart/chart-schema.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/chart/chart-schema.ts)
- [src/services/chart/chart.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/chart/chart.service.ts)
- [src/components/cards/chart-card.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/cards/chart-card.tsx)

## Live Events

The client gets live updates through session-scoped events.

Primary path:

- browser subscribes to SSE
- server publishes session events
- client stores update from those payloads

Relevant files:

- [src/app/api/events/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/events/route.ts)
- [src/server/session-events.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/session-events.ts)
- [src/hooks/use-echolens-ws.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/hooks/use-echolens-ws.ts)

Compatibility path:

- [src/websocket/ws-server.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/websocket/ws-server.ts)

## Security Notes

Things a new teammate should know:

- Raw provider keys should never be returned to the browser.
- Deepgram browser access should happen through a short-lived token.
- Workspace credentials are encrypted before storage.
- Provider config should be resolved per workspace, not process-wide.

If you touch auth, BYOK, or provider logic, read these first:

- [src/server/foundation/auth.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/auth.ts)
- [src/server/foundation/crypto.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/crypto.ts)
- [src/server/foundation/providers.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/providers.ts)
- [src/app/api/deepgram/token/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/deepgram/token/route.ts)

## If You Are An Intern Starting Here

A good first-day path would be:

1. Run the app locally.
2. Read the login flow and workspace settings flow.
3. Open the orchestrator and follow one transcript chunk from input to rendered artifact.
4. Read one service end to end, such as the chart service or reference service.
5. Only then start touching deeper legacy modules.

Suggested reading order:

1. [README.md](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/README.md)
2. [docs/architecture.md](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/docs/architecture.md)
3. [src/app/login/page.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/login/page.tsx)
4. [src/components/workspace/workspace-settings-panel.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/workspace/workspace-settings-panel.tsx)
5. [src/components/layout/main-layout.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/layout/main-layout.tsx)
6. [src/services/orchestrator/orchestrator.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/orchestrator/orchestrator.service.ts)

## Known Boundaries

Be aware of these before you take on work:

- The repo still contains older Momentum and sales-oriented modules.
- Full lint and full test are not as clean as the core build path yet.
- SQLite is a stepping stone, not the final multi-instance persistence layer.
- Some integration-facing modules still reflect earlier product experiments.

## Most Reliable Verification Step

Right now, the strongest deployment gate is:

```bash
npm run build
```

If you are shipping the current HUD flow, build health matters more than broad legacy test coverage.
