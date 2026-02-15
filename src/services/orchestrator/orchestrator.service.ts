import type { OrchestratorRequest, SalesOrchestratorResponse } from '@/types/agents';
import { processSalesTranscript } from '@/services/sales/sales-orchestrator';
import { getMastraConversationRuntime } from '@/services/mastra/mastra-runtime';

export async function processTranscript(
  request: OrchestratorRequest
): Promise<SalesOrchestratorResponse> {
  const callId = request.callId ?? `call-${request.sessionId}`;
  const speaker = request.speaker ?? 'customer';

  // Drive Mastra LLM response generation (brain) using GEMINI_API_KEY.
  // This runs alongside the heuristic sales signals until Mastra fully replaces Sales Orchestrator.
  if (speaker !== 'agent') {
    void getMastraConversationRuntime()
      .processTranscript({
        sessionId: request.sessionId,
        callId,
        text: request.text,
        speaker,
        timestamp: request.timestamp,
      })
      .catch((err) => {
        console.error('[Orchestrator] Mastra runtime failed:', err);
      });
  }

  const result = await processSalesTranscript({
    sessionId: request.sessionId,
    callId,
    text: request.text,
    speaker,
    timestamp: request.timestamp,
    emitTranscript: true,
  });

  return {
    stage: result.stage,
    objections: result.objections,
    buyingSignals: result.buyingSignals,
    nextSteps: result.nextSteps,
  };
}
