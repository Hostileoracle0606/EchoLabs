# Architecture Guide

## Overview

EchoLabs is a server-backed Next.js application with a live presentation HUD, workspace-scoped provider credentials, grounded retrieval, and event-driven artifact rendering.

At a high level, the system is split into five layers:

1. Client UI and local stores
2. Session and workspace foundation
3. Live transport and event fanout
4. Orchestration and artifact generation
5. Workspace-owned data and provenance

## Request Flow

### 1. Session bootstrap

- `/login` creates or resumes a server session through [src/app/api/auth/session/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/auth/session/route.ts)
- A signed cookie stores the active session ID
- `/app` requires an authenticated viewer via [src/server/foundation/auth.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/auth.ts)

### 2. Workspace binding

- A session always resolves to an active workspace
- Workspace membership and active workspace switching live in [src/server/foundation/repository.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/repository.ts)
- Provider keys are stored per workspace, not globally

### 3. Voice capture

- The browser mic flow starts in [src/components/controls/mic-button.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/controls/mic-button.tsx)
- Deepgram streaming is handled in [src/hooks/use-deepgram.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/hooks/use-deepgram.ts)
- Browser token minting is handled by [src/app/api/deepgram/token/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/deepgram/token/route.ts)

### 4. Orchestration

- The browser posts transcript text to [src/app/api/orchestrator/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/orchestrator/route.ts)
- The deterministic pipeline lives in [src/services/orchestrator/orchestrator.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/orchestrator/orchestrator.service.ts)
- It triggers chart, reference, context, and summary services directly

### 5. Live delivery

- Session events are published through [src/server/session-events.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/session-events.ts)
- SSE is exposed at [src/app/api/events/route.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/api/events/route.ts)
- WebSocket support remains in [src/websocket/ws-server.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/websocket/ws-server.ts) for compatibility and voice transport

## Main Code Areas

### App and UI

- Landing page: [src/app/page.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/page.tsx)
- Authenticated app: [src/app/app/page.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/app/app/page.tsx)
- Main session UI: [src/components/layout/main-layout.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/layout/main-layout.tsx)
- Workspace settings: [src/components/workspace/workspace-settings-panel.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/workspace/workspace-settings-panel.tsx)

### Client State

- Presentation HUD state: [src/store/echolens-store.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/store/echolens-store.ts)
- Sales-specific state that still exists upstream: [src/store/momentum-store.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/store/momentum-store.ts)

### Foundation Layer

- Auth helpers: [src/server/foundation/auth.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/auth.ts)
- Repository operations: [src/server/foundation/repository.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/repository.ts)
- Secret encryption: [src/server/foundation/crypto.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/crypto.ts)
- Persistence: [src/server/foundation/store.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/store.ts)
- Source ingestion/search helpers: [src/server/foundation/sources.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/sources.ts)

### Artifact Services

- Charts: [src/services/chart/chart.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/chart/chart.service.ts)
- Context: [src/services/context/context.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/context/context.service.ts)
- References: [src/services/reference/reference.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/reference/reference.service.ts)
- Summaries: [src/services/summary/summary.service.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/summary/summary.service.ts)

## Data Model

The foundation store tracks:

- `users`
- `workspaces`
- `memberships`
- `sessions`
- `providerCredentials`
- `connectorConnections`
- `sources`
- `sourceChunks`

Types are defined in [src/server/foundation/types.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/server/foundation/types.ts).

## Provenance Model

Generated artifacts are grounded to stored source records. The app now carries provenance metadata through the UI event layer:

- `sourceId`
- `connectorId`
- `connectorType`
- `syncedAt`

See [src/types/events.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/types/events.ts) and [src/types/agents.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/types/agents.ts).

## Charts

Charts are schema-first instead of free-form Mermaid generation.

- Chart types: [src/types/charts.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/types/charts.ts)
- Validation schema: [src/services/chart/chart-schema.ts](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/services/chart/chart-schema.ts)
- UI renderer: [src/components/cards/chart-card.tsx](/Users/trinabgoswamy/Downloads/PROJECT%20HUB/echolens/src/components/cards/chart-card.tsx)

Mermaid validation code still exists for legacy compatibility, but the primary business-chart path is now structured chart specs.

## Transport Model

### Primary path

- Browser subscribes via SSE
- Server publishes session events
- UI updates stores from event payloads

### Compatibility path

- WebSocket is still used for `/ws`
- It remains useful for audio/voice-related flows and compatibility with older paths

## Security Model

- Raw provider secrets are never returned to the browser
- Browser-side Deepgram access uses a short-lived token
- Provider credentials are encrypted at rest using `APP_ENCRYPTION_KEY`
- Credentials are scoped to the active workspace

## Known Boundaries

- The SQLite foundation store is single-instance friendly, not horizontally scalable
- Some upstream CRM, Mastra, and Neo4j modules are still evolving and have separate cleanup work pending
- The repo contains both the newer EchoLabs presentation-HUD flow and older Momentum sales-oriented modules

## Recommended Next Step

If you want to continue hardening the platform, the highest-leverage next change is swapping the SQLite-backed foundation store for Postgres while preserving the repository interfaces.
