import type { OrchestratorRequest, SalesOrchestratorResponse } from '@/types/agents';
import { processSalesTranscript } from '@/services/sales/sales-orchestrator';

export async function processTranscript(
  request: OrchestratorRequest
): Promise<SalesOrchestratorResponse> {
  const callId = request.callId ?? `call-${request.sessionId}`;
  const speaker = request.speaker ?? 'customer';

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
