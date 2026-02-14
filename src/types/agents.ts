import type { ClassifiedIntent } from './intents';
import type { SalesStage } from './sales';

export interface AgentRequest {
  intent: ClassifiedIntent;
  context: string;
  sessionId: string;
  fullTranscript?: string;
}

export interface OrchestratorRequest {
  text: string;
  timestamp: number;
  sessionId: string;
  context?: string;
  callId?: string;
  customerId?: string;
  speaker?: 'customer' | 'agent' | 'system';
  schemaVersion?: 1 | 2;
}

export interface OrchestratorResponse {
  intents: ClassifiedIntent[];
  dispatched: string[];
}

export interface SalesOrchestratorResponse {
  stage: SalesStage;
  objections: number;
  buyingSignals: number;
  nextSteps: number;
}

export type MermaidChartType =
  | 'pie'
  | 'xychart-beta'
  | 'graph'
  | 'mindmap'
  | 'timeline'
  | 'quadrantChart'
  | 'sequenceDiagram'
  | 'gantt'
  | 'erDiagram';

export interface ChartAgentResponse {
  id?: string;
  mermaidCode: string;
  chartType: MermaidChartType;
  title: string;
  narration: string;
}

export interface Source {
  title: string;
  url: string;
  snippet: string;
  confidence: 'verified' | 'partial' | 'unverified';
  domain: string;
}

export interface ReferenceAgentResponse {
  sources: Source[];
  query: string;
}

export interface ContextMatch {
  id: string;
  matchType: 'email' | 'doc' | 'calendar' | 'slack';
  title: string;
  preview: string;
  from?: string;
  date?: string;
  channel?: string;
  avatarColor?: string;
  fileType?: string;
  relevanceScore: number;
}

export interface ContextAgentResponse {
  matches: ContextMatch[];
}

export interface SummaryBullet {
  id: string;
  text: string;
  category: 'key_point' | 'decision' | 'action_item' | 'question';
  owner?: string;
  timestamp: number;
}

export interface SummaryAgentResponse {
  bullets: SummaryBullet[];
}
