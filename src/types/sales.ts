import type { SchemaVersion, TranscriptSpeaker } from './transcript';

export type SalesStage =
  | 'opening'
  | 'discovery'
  | 'presentation'
  | 'objection_handling'
  | 'closing'
  | 'follow_up';

export type ObjectionType =
  | 'price'
  | 'timing'
  | 'authority'
  | 'competition'
  | 'value'
  | 'trust'
  | 'scope';

export type ObjectionSeverity = 'low' | 'medium' | 'high';

export interface Objection {
  id: string;
  type: ObjectionType;
  text: string;
  severity: ObjectionSeverity;
  requiresImmediate: boolean;
  detectedAt: number;
  speaker: TranscriptSpeaker;
}

export type BuyingSignalType = 'direct' | 'indirect' | 'timeline';

export interface BuyingSignal {
  id: string;
  type: BuyingSignalType;
  text: string;
  score: number;
  detectedAt: number;
  speaker: TranscriptSpeaker;
}

export interface NextStep {
  id: string;
  text: string;
  owner?: string;
  dueDate?: string;
  confidence: number;
  detectedAt: number;
}

export type CoachingCategory =
  | 'rapport'
  | 'discovery'
  | 'presentation'
  | 'objection'
  | 'closing'
  | 'compliance';

export interface CoachingTip {
  id: string;
  title: string;
  detail: string;
  category: CoachingCategory;
  confidence: number;
  detectedAt: number;
}

export type ComplianceSeverity = 'info' | 'warning' | 'critical';

export interface ComplianceWarning {
  id: string;
  ruleId: string;
  text: string;
  severity: ComplianceSeverity;
  detectedAt: number;
  speaker: TranscriptSpeaker;
}

export interface CallSummary {
  id: string;
  recap: string;
  keyPoints: string[];
  objections: string[];
  actionItems: string[];
  nextStep?: string;
  outcome?: string;
  generatedAt: number;
}

export interface CallSessionMetadata {
  schemaVersion: SchemaVersion;
  callId: string;
  sessionId: string;
  customerId?: string;
  phoneNumber?: string;
  startedAt: number;
}

export interface SalesSignalEnvelope {
  schemaVersion: SchemaVersion;
  callId: string;
  sessionId: string;
}
