import { geminiGenerate } from '../gemini/gemini.client';
import { SUMMARY_SWEEP_PROMPT } from './prompts';
import { deduplicateBullets } from './deduplicator';
import type { AgentRequest, SummaryAgentResponse, SummaryBullet } from '@/types/agents';

// In-memory store of existing bullets per session (for deduplication)
const sessionBullets = new Map<string, SummaryBullet[]>();

const INTENT_TO_CATEGORY: Record<string, SummaryBullet['category']> = {
  KEY_POINT: 'key_point',
  DECISION: 'decision',
  ACTION_ITEM: 'action_item',
  QUESTION: 'question',
};

export function processSummaryIntent(request: AgentRequest): SummaryAgentResponse {
  const { intent, sessionId } = request;

  const category = INTENT_TO_CATEGORY[intent.type] || 'key_point';
  const newBullet: SummaryBullet = {
    id: `bullet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: intent.excerpt,
    category,
    timestamp: Date.now(),
  };

  const existing = sessionBullets.get(sessionId) || [];
  const deduped = deduplicateBullets([newBullet], existing);

  if (deduped.length > 0) {
    existing.push(...deduped);
    sessionBullets.set(sessionId, existing);
  }

  return { bullets: deduped };
}

export async function processTranscriptSweep(
  fullTranscript: string,
  sessionId: string
): Promise<SummaryAgentResponse> {
  try {
    const response = await geminiGenerate({
      systemPrompt: SUMMARY_SWEEP_PROMPT,
      userPrompt: `Extract key points from this meeting transcript:\n\n"${fullTranscript}"`,
      jsonMode: true,
    });

    const parsed = JSON.parse(response);

    if (!parsed.bullets || !Array.isArray(parsed.bullets)) {
      return { bullets: [] };
    }

    const newBullets: SummaryBullet[] = parsed.bullets
      .filter(
        (b: Record<string, unknown>) =>
          typeof b.text === 'string' &&
          typeof b.category === 'string'
      )
      .map((b: Record<string, string>) => ({
        id: `bullet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: b.text,
        category: b.category as SummaryBullet['category'],
        owner: b.owner || undefined,
        timestamp: Date.now(),
      }));

    const existing = sessionBullets.get(sessionId) || [];
    const deduped = deduplicateBullets(newBullets, existing);

    if (deduped.length > 0) {
      existing.push(...deduped);
      sessionBullets.set(sessionId, existing);
    }

    return { bullets: deduped };
  } catch {
    return { bullets: [] };
  }
}

export function getSessionBullets(sessionId: string): SummaryBullet[] {
  return sessionBullets.get(sessionId) || [];
}

export function resetSummaryState(): void {
  sessionBullets.clear();
}
