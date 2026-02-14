
import { classifyIntents } from './intent-classifier';
import { scorePriorities } from './priority-scorer';
import type { OrchestratorRequest, OrchestratorResponse, AgentRequest } from '@/types/agents';
import { INTENT_TO_AGENT_MAP, type ClassifiedIntent } from '@/types/intents';
import { generateChart } from '../chart/chart.service';
import { processSummaryIntent } from '../summary/summary.service';
import { findReferences } from '../reference/reference.service';
import { findContextMatches } from '../context/context.service';
import { broadcast } from '@/websocket/ws-server';


const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// Map intent types to their service functions
const AGENT_FUNCTIONS: Record<string, (req: AgentRequest) => Promise<any>> = {
  DATA_CLAIM: generateChart,
  KEY_POINT: processSummaryIntent,
  DECISION: processSummaryIntent,
  ACTION_ITEM: processSummaryIntent,
  QUESTION: processSummaryIntent,
  REFERENCE: findReferences,
  // Note: Context agent might run generally or on specific intents, usually separate
};

// Regex patterns for speculative execution
const SPECULATIVE_PATTERNS: Record<string, RegExp> = {
  DATA_CLAIM: /\d+%|\$[\d,]+|million|billion|\d+ (customers|users|percent|growth)/i,
  REFERENCE: /according to|study|report|research|article|paper/i,
  DECISION: /decided|agreed|choosing|going with|conclusion/i,
  ACTION_ITEM: /need to|should|must|deadline|follow up|action item/i,
  QUESTION: /\?$/
};

// Deterministic Chart Generation (Zero-Shot)
function generateDeterministicChart(text: string): { chart: any, confidence: number } | null {
  // Regex for "X grew Y%" or "X is Y%"
  const growthMatch = text.match(/(revenue|sales|users|growth|profit)\s*(grew|increased|rose|is|hit)\s*(\d+)%/i);
  if (growthMatch) {
    const [, metric, , value] = growthMatch;
    const val = parseInt(value, 10);
    const remainder = 100 - val;

    // Simple Pie Chart
    return {
      chart: {
        mermaidCode: `pie title ${metric} Growth\n  "Growth" : ${val}\n  "Baseline" : ${remainder}`,
        chartType: "pie",
        title: `${metric} Growth Analysis`,
        narration: `Zero-shot visualization: ${metric} shows significant movement of ${val}%.`,
        sourceExcerpt: text
      },
      confidence: 0.9
    };
  }

  // Regex for "X vs Y" comparison (simple 2 items)
  // E.g., "500 enterprise vs 200 smb"
  const comparisonMatch = text.match(/(\d+)\s+([a-z]+)\s+vs\s+(\d+)\s+([a-z]+)/i);
  if (comparisonMatch) {
    const [, val1, label1, val2, label2] = comparisonMatch;
    return {
      chart: {
        mermaidCode: `pie title Comparison\n  "${label1}" : ${val1}\n  "${label2}" : ${val2}`,
        chartType: "pie",
        title: `${label1} vs ${label2}`,
        narration: `Comparing ${label1} (${val1}) against ${label2} (${val2}).`,
        sourceExcerpt: text
      },
      confidence: 0.85
    };
  }

  return null;
}

export async function processTranscript(
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  const { text, sessionId, context } = request;

  // 1. Zero-Shot Fast Path (Instant)
  // Try to generate a deterministic chart immediately
  const zeroShot = generateDeterministicChart(text);
  let activeChartId: string | undefined;

  if (zeroShot && zeroShot.confidence > 0.8) {
    console.log('[Orchestrator] Zero-Shot Chart Matches!');
    activeChartId = `chart-${Date.now()}`;

    const fastChart = {
      ...zeroShot.chart,
      id: activeChartId // Assign ID for updates
    };

    // BROADCAST IMMEDIATELY (<10ms)
    broadcast('agent:chart', sessionId, fastChart);
  }

  // 2. Start Intent Classification (LLM)
  const classificationPromise = classifyIntents(text);

  // 3. Speculative Execution (Parallel) with Verification logic
  const speculativePromises = new Map<string, Promise<any>>();

  for (const [type, pattern] of Object.entries(SPECULATIVE_PATTERNS)) {
    if (pattern.test(text)) {
      const handler = AGENT_FUNCTIONS[type];
      if (handler) {
        console.log(`[Orchestrator] Speculatively starting ${type} agent`);
        const mockIntent: ClassifiedIntent = {
          type: type as any,
          confidence: 0.8,
          excerpt: text,
          priority: 0
        };
        const req: AgentRequest = { intent: mockIntent, context: context || text, sessionId };

        let promise = handler(req);

        // If this is a chart and we have an active zero-shot ID, we need to inject it 
        // OR we just handle the result mapping here. 
        // Since `agent:chart` payload now supports ID, let's attach it to the result if it's a chart.
        if (type === 'DATA_CLAIM' && activeChartId) {
          promise = promise.then(res => ({ ...res, id: activeChartId }));
        }

        speculativePromises.set(type, promise.catch(err => {
          console.error(`[Orchestrator] Speculative ${type} failed:`, err);
          return null;
        }));
      }
    }
  }

  // Always run Context Search speculatively/parallely
  const contextReq: AgentRequest = {
    intent: { type: 'CONTEXT_SEARCH', confidence: 1, excerpt: text } as any,
    context: context || text,
    sessionId
  };
  findContextMatches(contextReq).then(res => {
    if (res.matches.length > 0) broadcast('agent:context', sessionId, res.matches);
  }).catch(err => console.error('[Orchestrator] Context agent error:', err));

  // 4. Await Classification
  const classification = await classificationPromise;
  const scoredIntents = scorePriorities(classification.intents);

  // 5. Resolve & Broadcast (Verification Step)
  const agentCalls: string[] = [];
  const finalPromises: Promise<void>[] = [];

  for (const intent of scoredIntents) {
    agentCalls.push(intent.type);
    const handler = AGENT_FUNCTIONS[intent.type];

    if (handler) {
      let resultPromise = speculativePromises.get(intent.type);

      if (!resultPromise) {
        // Not speculated, start now
        const req: AgentRequest = { intent, context: context || text, sessionId };
        let promise = handler(req);

        // If we somehow missed the speculative pattern but now matched intent, 
        // and we had a zero-shot chart (unlikely but possible if regex differs), attach ID.
        if (intent.type === 'DATA_CLAIM' && activeChartId) {
          promise = promise.then(res => ({ ...res, id: activeChartId }));
        }

        resultPromise = promise.catch(err => {
          console.error(`[Orchestrator] Agent error for ${intent.type}:`, err);
          return null;
        });
      }

      finalPromises.push(
        resultPromise!.then(result => {
          if (result) {
            // VERIFICATION LOGIC for Charts
            if (intent.type === 'DATA_CLAIM' && activeChartId) {
              // We have a zero-shot chart already displayed.
              // Only update if the LLM result is significantly different or "better"?
              // For now, always update to ensure "verified" accuracy, 
              // but via the ID it will perform a smooth update in the UI.
              console.log('[Orchestrator] Updating Zero-Shot Chart with Verified Result');
            }
            broadcastResult(intent.type, sessionId, result);
          }
        })
      );
    }
  }

  // Wait for all confirmed agents
  await Promise.allSettled(finalPromises);

  return {
    intents: scoredIntents,
    dispatched: agentCalls,
  };
}

function broadcastResult(type: string, sessionId: string, result: any) {
  if (type === 'DATA_CLAIM') {
    broadcast('agent:chart', sessionId, result);
  } else if (['KEY_POINT', 'DECISION', 'ACTION_ITEM', 'QUESTION'].includes(type)) {
    broadcast('agent:summary', sessionId, result);
  } else if (type === 'REFERENCE') {
    broadcast('agent:reference', sessionId, result);
  }
}
