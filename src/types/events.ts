import type {
  BuyingSignal,
  CallSummary,
  CoachingTip,
  ComplianceWarning,
  NextStep,
  Objection,
  SalesSignalEnvelope,
  SalesStage,
} from './sales';
import type { SchemaVersion, TranscriptSpeaker } from './transcript';
import type { ChartSpec } from './charts';

export type WsEventType =
  | 'transcript:update'
  | 'agent:status'
  | 'error'
  | 'session:start'
  | 'agent:chart'
  | 'agent:reference'
  | 'agent:context'
  | 'agent:summary'
  | 'session:end'
  | 'sales:stage'
  | 'sales:objection'
  | 'sales:buying-signal'
  | 'sales:next-step'
  | 'sales:coaching'
  | 'sales:compliance'
  | 'sales:summary'
  | 'voice:status'
  | 'voice:start'
  | 'voice:stop'
  | 'voice:interrupt';

export interface WsMessage<T = unknown> {
  event: WsEventType;
  sessionId: string;
  timestamp: number;
  payload: T;
}

export interface ChartPayload {
  id?: string;
  chartSpec: ChartSpec;
  sourceExcerpt: string;
  narration: string;
  provenance?: {
    sourceIds: string[];
    connectorIds: string[];
    syncedAt?: string;
  };
}

export interface ReferencePayload {
  sources: {
    sourceId: string;
    connectorId: string;
    connectorType: string;
    syncedAt: string;
    title: string;
    url?: string;
    snippet: string;
    confidence: 'verified' | 'partial' | 'unverified';
    domain: string;
  }[];
  query: string;
  provenance: {
    sourceIds: string[];
    connectorIds: string[];
    syncedAt?: string;
  };
}

export interface ContextPayload {
  matchType: 'email' | 'doc' | 'calendar' | 'slack';
  matches: {
    id: string;
    sourceId: string;
    connectorId: string;
    connectorType: string;
    syncedAt: string;
    title: string;
    preview: string;
    from?: string;
    date?: string;
    channel?: string;
    avatarColor?: string;
    fileType?: string;
    relevanceScore: number;
  }[];
  provenance: {
    sourceIds: string[];
    connectorIds: string[];
    syncedAt?: string;
  };
}

export interface SummaryPayload {
  bullets: {
    id: string;
    text: string;
    category: 'key_point' | 'decision' | 'action_item' | 'question';
    owner?: string;
    timestamp: number;
    isNew: boolean;
  }[];
}

export interface AgentStatusPayload {
  agent: string;
  status: 'processing' | 'complete' | 'error';
  message?: string;
}

export interface ErrorPayload {
  code: string;
  message: string;
  agent?: string;
}

export interface TranscriptUpdatePayloadV2 {
  schemaVersion: SchemaVersion;
  callId: string;
  sessionId: string;
  speaker: TranscriptSpeaker;
  speakerId?: number;
  text: string;
  isFinal: boolean;
  timestamp: number;
  confidence?: number;
  words?: any[];
  utterances?: any[];
  fullTranscript?: string;
  language?: string;
  languages?: string[];
}

export interface SalesStagePayload extends SalesSignalEnvelope {
  stage: SalesStage;
  confidence: number;
}

export interface SalesObjectionPayload extends SalesSignalEnvelope {
  objections: Objection[];
}

export interface SalesBuyingSignalPayload extends SalesSignalEnvelope {
  signals: BuyingSignal[];
}

export interface SalesNextStepPayload extends SalesSignalEnvelope {
  steps: NextStep[];
}

export interface SalesCoachingPayload extends SalesSignalEnvelope {
  tips: CoachingTip[];
}

export interface SalesCompliancePayload extends SalesSignalEnvelope {
  warnings: ComplianceWarning[];
}

export interface SalesSummaryPayload extends SalesSignalEnvelope {
  summary: CallSummary;
}

export interface VoiceStatusPayload extends SalesSignalEnvelope {
  status: 'connected' | 'streaming' | 'stopped' | 'error';
  message?: string;
}
