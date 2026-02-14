import { broadcast } from '@/websocket/ws-server';
import type { SalesStage, CallSummary, SalesSignalEnvelope } from '@/types/sales';
import { detectBuyingSignals, detectNextSteps, detectObjections, generateCoachingTips, inferStage } from './sales-heuristics';
import { ComplianceEngine } from '@/services/policy/compliance-engine';
import { getTranscriptStore } from '@/services/transcript/transcript-store';
import { updateCrmTool } from '@/mastra/tools';
import { getClientzoneAdapter } from '@/integrations/clientzone/clientzone.adapter';
import type { TranscriptSpeaker } from '@/types/transcript';
import { getThreadMemory } from '@/services/memory/thread-memory';

interface SalesSessionState {
  stage: SalesStage;
  objections: ReturnType<typeof detectObjections>;
  buyingSignals: ReturnType<typeof detectBuyingSignals>;
  nextSteps: ReturnType<typeof detectNextSteps>;
  coachingTips: ReturnType<typeof generateCoachingTips>;
  complianceWarnings: ReturnType<ComplianceEngine['evaluate']>;
  summary: CallSummary | null;
}

const sessionState = new Map<string, SalesSessionState>();

function getSessionState(sessionId: string): SalesSessionState {
  const existing = sessionState.get(sessionId);
  if (existing) return existing;
  const state: SalesSessionState = {
    stage: 'opening',
    objections: [],
    buyingSignals: [],
    nextSteps: [],
    coachingTips: [],
    complianceWarnings: [],
    summary: null,
  };
  sessionState.set(sessionId, state);
  return state;
}

function buildEnvelope(sessionId: string, callId: string): SalesSignalEnvelope {
  return {
    schemaVersion: 2,
    sessionId,
    callId,
  };
}

function buildSummary(state: SalesSessionState, sessionId: string, callId: string): CallSummary {
  const now = Date.now();
  return {
    id: `summary-${now}-${Math.random().toString(36).slice(2, 6)}`,
    recap: `Conversation is in ${state.stage.replace('_', ' ')} stage.`,
    keyPoints: [],
    objections: state.objections.map((o) => o.type),
    actionItems: state.nextSteps.map((s) => s.text),
    nextStep: state.nextSteps[0]?.text,
    outcome: undefined,
    generatedAt: now,
  };
}

export async function processSalesTranscript(input: {
  sessionId: string;
  callId: string;
  text: string;
  speaker: TranscriptSpeaker;
  timestamp?: number;
  emitTranscript?: boolean;
}) {
  const { sessionId, callId, text, speaker, timestamp, emitTranscript } = input;
  const state = getSessionState(sessionId);
  const transcriptStore = getTranscriptStore();
  const complianceEngine = new ComplianceEngine();
  const envelope = buildEnvelope(sessionId, callId);
  const threadId = `conversation-${sessionId}`;
  getThreadMemory().addMessage(threadId, {
    role: speaker === 'agent' ? 'assistant' : 'user',
    content: text,
    timestamp: timestamp ?? Date.now(),
  });

  if (emitTranscript) {
    broadcast('transcript:update', sessionId, {
      schemaVersion: 2,
      callId,
      sessionId,
      speaker,
      text,
      isFinal: true,
      timestamp: timestamp ?? Date.now(),
    });
  }

  transcriptStore.addChunk(sessionId, callId, {
    text,
    speaker,
    isFinal: true,
    timestamp,
  });

  const nextStage = inferStage(text, state.stage);
  if (nextStage !== state.stage) {
    state.stage = nextStage;
    broadcast('sales:stage', sessionId, {
      ...envelope,
      stage: nextStage,
      confidence: 0.6,
    });
  }

  const objections = detectObjections(text, speaker);
  if (objections.length > 0) {
    state.objections.push(...objections);
    broadcast('sales:objection', sessionId, { ...envelope, objections });
  }

  const signals = detectBuyingSignals(text, speaker);
  if (signals.length > 0) {
    state.buyingSignals.push(...signals);
    broadcast('sales:buying-signal', sessionId, { ...envelope, signals });
  }

  const steps = detectNextSteps(text);
  if (steps.length > 0) {
    state.nextSteps.push(...steps);
    broadcast('sales:next-step', sessionId, { ...envelope, steps });
  }

  const tips = generateCoachingTips(text, state.stage);
  if (tips.length > 0) {
    state.coachingTips.push(...tips);
    broadcast('sales:coaching', sessionId, { ...envelope, tips });
  }

  const warnings = complianceEngine.evaluate(text, speaker);
  if (warnings.length > 0) {
    state.complianceWarnings.push(...warnings);
    broadcast('sales:compliance', sessionId, { ...envelope, warnings });
  }

  // TODO: Replace heuristics with Mastra Sales Director agent + workflows.

  state.summary = buildSummary(state, sessionId, callId);
  broadcast('sales:summary', sessionId, { ...envelope, summary: state.summary });

  if (objections.length > 0 || signals.length > 0 || steps.length > 0) {
    await updateCrmTool.execute({
      opportunityId: callId,
      updates: {
        objections: objections.map((o) => o.type),
        buyingSignals: signals.map((s) => s.type),
        nextSteps: steps.map((s) => s.text),
        stage: state.stage,
      },
    });
  }

  // TODO: When Clientzone API is available, provide summary + action items.
  if (state.summary) {
    await getClientzoneAdapter().sendSummary({
      callId,
      sessionId,
      summary: state.summary,
      nextSteps: state.nextSteps,
      actionItems: state.nextSteps.map((s) => s.text),
    });
  }

  return {
    stage: state.stage,
    objections: objections.length,
    buyingSignals: signals.length,
    nextSteps: steps.length,
  };
}

export function resetSalesSession(sessionId: string) {
  sessionState.delete(sessionId);
}
