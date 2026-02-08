export const INTENT_TYPES = [
  'DATA_CLAIM',
  'REFERENCE',
  'EMAIL_MENTION',
  'DOC_MENTION',
  'TOPIC_SHIFT',
  'KEY_POINT',
  'DECISION',
  'ACTION_ITEM',
  'QUESTION',
] as const;

export type IntentType = (typeof INTENT_TYPES)[number];

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number;
  excerpt: string;
  priority: number;
}

export interface ClassificationResult {
  intents: ClassifiedIntent[];
  rawText: string;
  processingTimeMs: number;
}

export const INTENT_PRIORITY: Record<IntentType, number> = {
  DATA_CLAIM: 9,
  REFERENCE: 7,
  EMAIL_MENTION: 6,
  DOC_MENTION: 6,
  ACTION_ITEM: 8,
  DECISION: 7,
  KEY_POINT: 6,
  QUESTION: 5,
  TOPIC_SHIFT: 3,
};

export const INTENT_TO_AGENT_MAP: Record<IntentType, string | null> = {
  DATA_CLAIM: '/api/agents/chart',
  REFERENCE: '/api/agents/reference',
  EMAIL_MENTION: '/api/agents/context',
  DOC_MENTION: '/api/agents/context',
  TOPIC_SHIFT: null,
  KEY_POINT: '/api/agents/summary',
  DECISION: '/api/agents/summary',
  ACTION_ITEM: '/api/agents/summary',
  QUESTION: null,
};
