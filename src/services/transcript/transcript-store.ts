import type { TranscriptChunkV2, TranscriptSpeaker } from '@/types/transcript';

const DEFAULT_SCHEMA_VERSION = 2 as const;

interface SessionTranscript {
  callId: string;
  sessionId: string;
  chunks: TranscriptChunkV2[];
}

export class TranscriptStore {
  private sessions = new Map<string, SessionTranscript>();

  ensureSession(sessionId: string, callId: string): SessionTranscript {
    const existing = this.sessions.get(sessionId);
    if (existing) return existing;
    const session: SessionTranscript = { callId, sessionId, chunks: [] };
    this.sessions.set(sessionId, session);
    return session;
  }

  addChunk(sessionId: string, callId: string, data: {
    text: string;
    speaker: TranscriptSpeaker;
    isFinal: boolean;
    timestamp?: number;
    confidence?: number;
  }): TranscriptChunkV2 {
    const session = this.ensureSession(sessionId, callId);
    const chunk: TranscriptChunkV2 = {
      schemaVersion: DEFAULT_SCHEMA_VERSION,
      callId,
      sessionId,
      speaker: data.speaker,
      text: data.text.trim(),
      timestamp: data.timestamp ?? Date.now(),
      isFinal: data.isFinal,
      confidence: data.confidence,
    };
    session.chunks.push(chunk);
    // TODO: Voice + call ingestion is partially wired; persist chunks to PostgreSQL
    // and add cleanup/formatting so transcripts are reliably viewable.
    return chunk;
  }

  getTranscript(sessionId: string): TranscriptChunkV2[] {
    return this.sessions.get(sessionId)?.chunks ?? [];
  }

  getRollingText(sessionId: string, windowMs: number): string {
    const cutoff = Date.now() - windowMs;
    const chunks = this.sessions.get(sessionId)?.chunks ?? [];
    return chunks.filter((chunk) => chunk.timestamp >= cutoff).map((chunk) => chunk.text).join(' ');
  }

  getFullText(sessionId: string): string {
    const chunks = this.sessions.get(sessionId)?.chunks ?? [];
    return chunks.map((chunk) => chunk.text).join(' ');
  }

  resetSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  resetAll(): void {
    this.sessions.clear();
  }
}

const globalForTranscript = global as unknown as { transcriptStore?: TranscriptStore };

export function getTranscriptStore(): TranscriptStore {
  if (!globalForTranscript.transcriptStore) {
    globalForTranscript.transcriptStore = new TranscriptStore();
  }
  return globalForTranscript.transcriptStore;
}
