export type WsEventType =
  | 'transcript:update'
  | 'agent:status'
  | 'error'
  | 'session:start'
  | 'agent:chart'
  | 'agent:reference'
  | 'agent:context'
  | 'agent:summary'
  | 'session:start'
  | 'session:end';

export interface WsMessage<T = unknown> {
  event: WsEventType;
  sessionId: string;
  timestamp: number;
  payload: T;
}

export interface ChartPayload {
  id?: string;
  mermaidCode: string;
  chartType: string;
  title: string;
  sourceExcerpt: string;
  narration: string;
}

export interface ReferencePayload {
  sources: {
    title: string;
    url: string;
    snippet: string;
    confidence: 'verified' | 'partial' | 'unverified';
    domain: string;
  }[];
  query: string;
}

export interface ContextPayload {
  matchType: 'email' | 'doc' | 'calendar' | 'slack';
  matches: {
    id: string;
    title: string;
    preview: string;
    from?: string;
    date?: string;
    channel?: string;
    avatarColor?: string;
    fileType?: string;
    relevanceScore: number;
  }[];
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
