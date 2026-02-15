import type { OrchestratorRequest, SalesOrchestratorResponse } from '@/types/agents';
import { classifyIntents } from './intent-classifier';
import { processSalesTranscript } from '@/services/sales/sales-orchestrator';
import { getMastraConversationRuntime } from '@/services/mastra/mastra-runtime';
import logger from '@/lib/logger';
import type { ClassifiedIntent } from '@/types/intents';

export async function processTranscript(
  request: OrchestratorRequest
): Promise<SalesOrchestratorResponse> {
  logger.flow('Orchestrator', 'START processTranscript', {
    sessionId: request.sessionId,
    text: request.text.substring(0, 100)
  });

  const callId = request.callId ?? `call-${request.sessionId}`;
  const speaker = request.speaker ?? 'customer';

  try {
    // 1. Classify intent
    logger.flow('Orchestrator', 'Classifying intent');
    const classificationResult = await classifyIntents(request.text);
    logger.info('Orchestrator', 'Intent classification complete', {
      intentCount: classificationResult.intents.length,
      types: classificationResult.intents.map((i: ClassifiedIntent) => i.type)
    });

    // 2. Drive Mastra LLM response generation (brain) using GEMINI_API_KEY.
    // This runs alongside the heuristic sales signals until Mastra fully replaces Sales Orchestrator.
    if (speaker !== 'agent') {
      logger.flow('Orchestrator', 'Processing with Mastra runtime');
      void getMastraConversationRuntime()
        .processTranscript({
          sessionId: request.sessionId,
          callId,
          text: request.text,
          speaker,
          timestamp: request.timestamp,
        })
        .catch((err) => {
          logger.error('Orchestrator', 'Mastra runtime failed', err);
        });
    }

    // 3. Process sales transcript
    logger.flow('Orchestrator', 'Processing sales transcript');
    const salesResult = await processSalesTranscript({
      text: request.text,
      timestamp: request.timestamp,
      sessionId: request.sessionId,
      speaker,
      callId,
    });
    logger.info('Orchestrator', 'Sales processing complete', {
      stage: salesResult.stage,
      objections: salesResult.objections,
      buyingSignals: salesResult.buyingSignals,
    });

    logger.flow('Orchestrator', 'END processTranscript', { success: true });
    return salesResult;
  } catch (error) {
    logger.error('Orchestrator', 'Error processing transcript', error);
    throw error;
  }
}
