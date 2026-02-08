import { classifyIntents } from './intent-classifier';
import { scorePriorities } from './priority-scorer';
import type { OrchestratorRequest, OrchestratorResponse } from '@/types/agents';
import { INTENT_TO_AGENT_MAP } from '@/types/intents';
import type { ClassifiedIntent } from '@/types/intents';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function processTranscript(
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  const { text, sessionId, context } = request;

  const classification = await classifyIntents(text);
  const scoredIntents = scorePriorities(classification.intents);

  const dispatched = await dispatchAgents(scoredIntents, sessionId, text, context);

  return {
    intents: scoredIntents,
    dispatched,
  };
}

async function dispatchAgents(
  intents: ClassifiedIntent[],
  sessionId: string,
  text: string,
  context?: string
): Promise<string[]> {
  const agentCalls: { route: string; intent: ClassifiedIntent }[] = [];

  for (const intent of intents) {
    const route = INTENT_TO_AGENT_MAP[intent.type];
    if (route) {
      agentCalls.push({ route, intent });
    }
  }

  if (agentCalls.length === 0) {
    return [];
  }

  const dispatches = agentCalls.map(({ route, intent }) =>
    fetch(`${BASE_URL}${route}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent,
        context: context || text,
        sessionId,
      }),
    })
  );

  await Promise.allSettled(dispatches);

  return agentCalls.map((call) => call.route);
}
