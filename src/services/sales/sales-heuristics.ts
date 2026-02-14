import type { BuyingSignal, CoachingTip, NextStep, Objection, ObjectionSeverity, SalesStage } from '@/types/sales';
import type { TranscriptSpeaker } from '@/types/transcript';

const OBJECTION_PATTERNS: Array<{ type: Objection['type']; regex: RegExp; severity: ObjectionSeverity }> = [
  { type: 'price', regex: /\b(too expensive|budget|cost|price|afford|pricing)\b/i, severity: 'high' },
  { type: 'timing', regex: /\b(not right now|later|next quarter|busy|timing)\b/i, severity: 'medium' },
  { type: 'authority', regex: /\b(need to check|talk to|boss|team|approval)\b/i, severity: 'medium' },
  { type: 'competition', regex: /\b(already use|working with|competitor|existing vendor)\b/i, severity: 'low' },
  { type: 'value', regex: /\b(not sure|don't see|why do we need|unclear value)\b/i, severity: 'high' },
  { type: 'trust', regex: /\b(never heard of|concerns about|security|trust)\b/i, severity: 'medium' },
  { type: 'scope', regex: /\b(feature gap|missing|doesn't support)\b/i, severity: 'medium' },
];

const BUYING_SIGNAL_PATTERNS: Array<{ type: BuyingSignal['type']; regex: RegExp; score: number }> = [
  { type: 'direct', regex: /\b(when can we start|how do we get started|next step|send the contract)\b/i, score: 10 },
  { type: 'indirect', regex: /\b(implementation|onboarding|integration|account manager)\b/i, score: 6 },
  { type: 'timeline', regex: /\b(this quarter|by end of month|asap|urgent|timeline)\b/i, score: 7 },
];

const NEXT_STEP_PATTERNS: Array<{ regex: RegExp; defaultText: string }> = [
  { regex: /\b(schedule|book|set up)\b/i, defaultText: 'Schedule a follow-up meeting' },
  { regex: /\b(send|share)\b/i, defaultText: 'Send requested materials' },
  { regex: /\b(trial|pilot)\b/i, defaultText: 'Offer a pilot or trial' },
];

export function detectObjections(text: string, speaker: TranscriptSpeaker): Objection[] {
  const now = Date.now();
  return OBJECTION_PATTERNS.filter((pattern) => pattern.regex.test(text)).map((pattern) => ({
    id: `objection-${now}-${Math.random().toString(36).slice(2, 6)}`,
    type: pattern.type,
    text,
    severity: pattern.severity,
    requiresImmediate: pattern.type === 'price' || pattern.type === 'value',
    detectedAt: now,
    speaker,
  }));
}

export function detectBuyingSignals(text: string, speaker: TranscriptSpeaker): BuyingSignal[] {
  const now = Date.now();
  return BUYING_SIGNAL_PATTERNS.filter((pattern) => pattern.regex.test(text)).map((pattern) => ({
    id: `signal-${now}-${Math.random().toString(36).slice(2, 6)}`,
    type: pattern.type,
    text,
    score: pattern.score,
    detectedAt: now,
    speaker,
  }));
}

export function detectNextSteps(text: string): NextStep[] {
  const now = Date.now();
  const steps = NEXT_STEP_PATTERNS.filter((pattern) => pattern.regex.test(text)).map((pattern) => ({
    id: `step-${now}-${Math.random().toString(36).slice(2, 6)}`,
    text: pattern.defaultText,
    confidence: 0.55,
    detectedAt: now,
  }));

  if (/\bnext step|follow up|circle back\b/i.test(text)) {
    steps.push({
      id: `step-${now}-${Math.random().toString(36).slice(2, 6)}`,
      text: 'Align on next steps and owners',
      confidence: 0.6,
      detectedAt: now,
    });
  }

  return steps;
}

export function inferStage(text: string, previousStage: SalesStage): SalesStage {
  if (/\b(overview|agenda|introduction)\b/i.test(text)) return 'opening';
  if (/\b(pain point|current process|workflow|needs)\b/i.test(text)) return 'discovery';
  if (/\b(demo|show|walk through|features)\b/i.test(text)) return 'presentation';
  if (/\b(concern|objection|hesitant)\b/i.test(text)) return 'objection_handling';
  if (/\b(next step|contract|sign|close)\b/i.test(text)) return 'closing';
  return previousStage;
}

export function generateCoachingTips(text: string, stage: SalesStage): CoachingTip[] {
  const now = Date.now();
  const tips: CoachingTip[] = [];

  if (stage === 'discovery' && /\b(tell me more|how)\b/i.test(text) === false) {
    tips.push({
      id: `tip-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title: 'Ask an open question',
      detail: 'Invite the buyer to describe their current process or pain points in their own words.',
      category: 'discovery',
      confidence: 0.45,
      detectedAt: now,
    });
  }

  if (stage === 'closing' && /\b(next step|calendar)\b/i.test(text) === false) {
    tips.push({
      id: `tip-${now}-${Math.random().toString(36).slice(2, 6)}`,
      title: 'Propose a concrete next step',
      detail: 'Offer a specific time for a follow-up or send a recap with action items.',
      category: 'closing',
      confidence: 0.5,
      detectedAt: now,
    });
  }

  return tips;
}
