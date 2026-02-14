# Momentum

## Quickstart (Run & Test)

1. Install dependencies:

```bash
npm install
```

Node 18+ is recommended (required for global `fetch` in the simulation scripts).

2. Start the app with WebSocket support:

```bash
npm run dev:ws
```

3. Open the app:

```
http://localhost:3000
```

4. Optional: run the demo simulation (drives the orchestrator):

```bash
npm run demo
```

5. Run tests:

```bash
npm run test
```

For remaining implementation work, see [TODO.md](TODO.md).

## Architecture Overview

Momentum is a real-time sales coaching platform built on a voice + agent pipeline. The current architecture is designed to swap in external services (Smallest.ai, Mastra.ai, CRM, Pinecone) while keeping a stable UI + WebSocket backbone.

### High-Level Flow
1. Audio is streamed from the client to the server over WebSocket.
2. The voice layer (Smallest.ai wrapper) emits partial/final transcripts.
3. Final transcripts are persisted and routed to the sales orchestration layer.
4. The orchestration layer detects objections, buying signals, next steps, coaching tips, and compliance warnings.
5. Signals are broadcast back to the UI in real time over WebSocket.
6. CRM / Clientzone updates are sent via tool wrappers (currently TODOs).

### Core Components
- **Voice Layer**: `src/voice/smallest-voice-pipeline.ts` and `src/services/voice/voice-session-manager.ts`
  - Streams audio → transcripts.
  - Supports barge‑in and low‑latency end‑of‑speech detection (TODO).
- **Sales Orchestrator**: `src/services/sales/sales-orchestrator.ts`
  - Current heuristic engine; designed to be replaced by Mastra agents + workflows.
  - Broadcasts `sales:*` events (stage, objections, signals, coaching, compliance, summary).
- **Mastra Runtime Scaffolding**: `src/mastra/*`
  - Agent/workflow/tool definitions are in place.
  - `MastraRuntime.generate` is a stub waiting for SDK integration.
- **Transcript + Memory**:
  - `src/services/transcript/transcript-store.ts` collects transcripts.
  - `src/services/memory/thread-memory.ts` mocks thread memory.
- **UI + State**:
  - Store: `src/store/momentum-store.ts`
  - WebSocket hook: `src/hooks/use-momentum-ws.ts`
  - Sales coaching UI: `src/components/layout/main-layout.tsx`
- **Integrations (Wrappers)**:
  - CRM: `src/mastra/tools/crm-tool.ts` (TODO: Salesforce or equivalent)
  - Knowledge Base: `src/mastra/tools/knowledge-base-tool.ts` (TODO: Pinecone)
  - Calendar: `src/mastra/tools/calendar-tool.ts` (TODO)
  - Clientzone: `src/integrations/clientzone/clientzone.adapter.ts` (TODO)

### WebSocket Events
The UI listens for:
- `transcript:update`
- `sales:stage`, `sales:objection`, `sales:buying-signal`, `sales:next-step`
- `sales:coaching`, `sales:compliance`, `sales:summary`
- `voice:status`

