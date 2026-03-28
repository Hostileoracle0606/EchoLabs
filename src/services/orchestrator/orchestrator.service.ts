import { generateChart } from '@/services/chart/chart.service';
import { findReferences } from '@/services/reference/reference.service';
import { findContextMatches } from '@/services/context/context.service';
import {
  processSummaryIntent,
  processTranscriptSweep,
  getSessionBullets,
} from '@/services/summary/summary.service';
import {
  createAgentStatus,
  createChartPayload,
  createContextPayloads,
  createReferencePayload,
  createSummaryPayload,
} from '@/server/agent-payloads';
import { broadcast } from '@/websocket/ws-server';
import type { ClassifiedIntent } from '@/types/intents';
import type { OrchestratorRequest, OrchestratorResponse } from '@/types/agents';

const SUMMARY_CATEGORIES = [
  { pattern: /decided|agreed|will proceed|approved|decision/i, type: 'DECISION' as const, name: 'extract_summary' },
  { pattern: /need to|should|must|follow up|action item|by friday|owner/i, type: 'ACTION_ITEM' as const, name: 'extract_summary' },
  { pattern: /important|key takeaway|bottom line|main point/i, type: 'KEY_POINT' as const, name: 'extract_summary' },
  { pattern: /\?|\bquestion\b|\bask\b/i, type: 'QUESTION' as const, name: 'extract_summary' },
];

function createIntent(
  type: ClassifiedIntent['type'],
  excerpt: string,
  priority: number
): ClassifiedIntent {
  return {
    type,
    confidence: 0.9,
    excerpt,
    priority,
  };
}

function shouldGenerateChart(text: string): boolean {
  return /\d+%|\$[\d,.]+|million|billion|\d+\s+(customers|users|hires|points|percent)/i.test(text);
}

function shouldFindReferences(text: string): boolean {
  return /according to|study|report|research|paper|memo|deck|document|kpmg|mckinsey|gartner/i.test(text);
}

function shouldSearchContext(text: string): boolean {
  return /email|document|meeting|calendar|slack|deck|board|sent me|scheduled|pipeline update/i.test(text);
}

async function runChart(request: OrchestratorRequest): Promise<boolean> {
  if (!shouldGenerateChart(request.text)) {
    return false;
  }

  broadcast('agent:status', request.sessionId, createAgentStatus('generate_chart', 'processing'));
  try {
    const result = await generateChart({
      intent: createIntent('DATA_CLAIM', request.text, 9),
      context: request.context || request.text,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
      providerApiKey: request.providerApiKey,
    });
    broadcast('agent:chart', request.sessionId, createChartPayload(result, request.text));
    broadcast('agent:status', request.sessionId, createAgentStatus('generate_chart', 'complete'));
  } catch (error) {
    broadcast(
      'agent:status',
      request.sessionId,
      createAgentStatus(
        'generate_chart',
        'error',
        error instanceof Error ? error.message : 'Chart generation failed'
      )
    );
  }
  return true;
}

async function runReferences(request: OrchestratorRequest): Promise<boolean> {
  if (!shouldFindReferences(request.text)) {
    return false;
  }

  broadcast('agent:status', request.sessionId, createAgentStatus('find_references', 'processing'));
  try {
    const result = await findReferences({
      intent: createIntent('REFERENCE', request.text, 7),
      context: request.context || request.text,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
    });
    broadcast('agent:reference', request.sessionId, createReferencePayload(result));
    broadcast('agent:status', request.sessionId, createAgentStatus('find_references', 'complete'));
  } catch (error) {
    broadcast(
      'agent:status',
      request.sessionId,
      createAgentStatus(
        'find_references',
        'error',
        error instanceof Error ? error.message : 'Reference lookup failed'
      )
    );
  }
  return true;
}

async function runContext(request: OrchestratorRequest): Promise<boolean> {
  if (!shouldSearchContext(request.text)) {
    return false;
  }

  broadcast('agent:status', request.sessionId, createAgentStatus('search_context', 'processing'));
  try {
    const result = await findContextMatches({
      intent: createIntent('DOC_MENTION', request.text, 6),
      context: request.context || request.text,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
    });
    for (const payload of createContextPayloads(result)) {
      broadcast('agent:context', request.sessionId, payload);
    }
    broadcast('agent:status', request.sessionId, createAgentStatus('search_context', 'complete'));
  } catch (error) {
    broadcast(
      'agent:status',
      request.sessionId,
      createAgentStatus(
        'search_context',
        'error',
        error instanceof Error ? error.message : 'Context retrieval failed'
      )
    );
  }
  return true;
}

async function runSummary(request: OrchestratorRequest): Promise<boolean> {
  const matchedCategories = SUMMARY_CATEGORIES.filter(({ pattern }) => pattern.test(request.text));

  if (matchedCategories.length === 0) {
    return false;
  }

  broadcast('agent:status', request.sessionId, createAgentStatus('extract_summary', 'processing'));
  let added = 0;

  try {
    for (const category of matchedCategories) {
      const result = await processSummaryIntent({
        intent: createIntent(category.type, request.text, 7),
        context: request.context || request.text,
        sessionId: request.sessionId,
      });
      added += result.bullets.length;
    }

    if (request.context) {
      const sweepResult = await processTranscriptSweep(
        request.context,
        request.sessionId,
        request.providerApiKey
      );
      added += sweepResult.bullets.length;
    }

    const allBullets = getSessionBullets(request.sessionId);
    if (added > 0) {
      broadcast('agent:summary', request.sessionId, createSummaryPayload(allBullets, added));
    }
    broadcast('agent:status', request.sessionId, createAgentStatus('extract_summary', 'complete'));
  } catch (error) {
    broadcast(
      'agent:status',
      request.sessionId,
      createAgentStatus(
        'extract_summary',
        'error',
        error instanceof Error ? error.message : 'Summary extraction failed'
      )
    );
  }

  return true;
}

export async function processTranscript(request: OrchestratorRequest): Promise<OrchestratorResponse> {
  const dispatched: string[] = [];

  const executions = await Promise.all([
    runChart(request),
    runReferences(request),
    runContext(request),
    runSummary(request),
  ]);

  if (executions[0]) dispatched.push('generate_chart');
  if (executions[1]) dispatched.push('find_references');
  if (executions[2]) dispatched.push('search_context');
  if (executions[3]) dispatched.push('extract_summary');

  return {
    intents: [],
    dispatched,
  };
}
