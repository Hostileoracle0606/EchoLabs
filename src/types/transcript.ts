export type SchemaVersion = 1 | 2;

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  isFinal: boolean;
}

export type TranscriptSpeaker = 'customer' | 'agent' | 'system';

export interface TranscriptChunkBase {
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptChunkV1 extends TranscriptChunkBase {
  words: TranscriptWord[];
}

export interface TranscriptChunkV2 extends TranscriptChunkBase {
  schemaVersion: 2;
  callId: string;
  sessionId: string;
  speaker: TranscriptSpeaker;
  confidence?: number;
  words?: TranscriptWord[];
  turnId?: string;
}

export type TranscriptChunk = TranscriptChunkV1 | TranscriptChunkV2;

export interface TranscriptBuffer {
  schemaVersion: SchemaVersion;
  callId?: string;
  chunks: TranscriptChunk[];
  fullText: string;
  lastSentAt: number;
  sessionId: string;
}
