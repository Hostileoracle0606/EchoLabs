# TODO – External Integrations + Missing Inputs

## Voice + Call Ingestion
1. Wire `src/voice/smallest-voice-pipeline.ts` to the Smallest.ai SDK/API.
2. Confirm required audio format (sample rate/codec) and update `src/hooks/use-voice-session.ts` to match.
3. Implement streaming STT callbacks (partial/final), end-of-speech, and barge‑in.
4. Implement TTS streaming and return audio back to the caller (call provider or UI playback).
5. Decide call-provider integration (SIP/WebRTC/telephony) and replace the dev mic path.

## Mastra.ai Agent Runtime
1. Replace the heuristic pipeline in `src/services/sales/sales-orchestrator.ts` with Mastra agents + workflows.
2. Implement `MastraRuntime.generate` in `src/mastra/index.ts` using Mastra SDK (telemetry, memory, tools).
3. Define the real agent prompts/rules sourced from AGENT.md / IDENTITY.md / PROMPT.md / RULES.md / CLIENT.md.
4. Hook Mastra thread memory to persistent storage and semantic search.

## CRM (Salesforce or Equivalent)
1. Implement `updateCrmTool` and `fetchCrmContextTool` in `src/mastra/tools/crm-tool.ts`.
2. Provide CRM credentials, auth flow, and field mapping for opportunities, tasks, and notes.

## Knowledge Base (Pinecone)
1. Implement vector search in `src/mastra/tools/knowledge-base-tool.ts`.
2. Provide Pinecone API key, index name, embedding model, and metadata schema.

## Calendar Scheduling
1. Implement `scheduleMeetingTool` in `src/mastra/tools/calendar-tool.ts`.
2. Provide Google/Microsoft credentials and availability rules.

## Pricing Engine
1. Implement pricing rules or API in `src/mastra/tools/pricing-tool.ts`.

## Clientzone Integration
1. Implement `ClientzoneAdapter` in `src/integrations/clientzone/clientzone.adapter.ts`.
2. Provide auth scopes, payload schemas, delivery method, and retention rules.

## Data Layer (Postgres + Redis)
1. Implement real DB connections in `src/services/storage/postgres.ts` and `src/services/storage/redis.ts`.
2. Define schema for transcripts, calls, metrics, and agent outputs.
3. Run `scripts/migrate-transcripts.ts` against production DB once schema is ready.

## Observability + Analytics
1. Wire telemetry exporters in Mastra config.
2. Persist call metrics using `src/services/analytics/call-analytics.ts`.
