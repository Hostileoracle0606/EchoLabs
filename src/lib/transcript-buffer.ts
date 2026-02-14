import type { TranscriptSpeaker } from '@/types/transcript';

interface BufferChunk {
  text: string;
  timestamp: number;
  isFinal: boolean;
  speaker: TranscriptSpeaker;
}

export class TranscriptBufferManager {
  private chunks: BufferChunk[] = [];
  private lastFlushIndex = 0;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  addChunk(text: string, isFinal: boolean, speaker: TranscriptSpeaker = 'customer'): void {
    if (!isFinal) return;

    this.chunks.push({
      text: text.trim(),
      timestamp: Date.now(),
      isFinal,
      speaker,
    });
  }

  getFullText(): string {
    return this.chunks.map((c) => c.text).join(' ');
  }

  getUnsentText(): string {
    const unsent = this.chunks.slice(this.lastFlushIndex);
    return unsent.map((c) => c.text).join(' ');
  }

  flushUnsent(): string {
    const text = this.getUnsentText();
    this.lastFlushIndex = this.chunks.length;
    return text;
  }

  getRollingTranscript(windowMs: number): string {
    const cutoff = Date.now() - windowMs;
    return this.chunks
      .filter((c) => c.timestamp >= cutoff)
      .map((c) => c.text)
      .join(' ');
  }

  getChunkCount(): number {
    return this.chunks.length;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  reset(): void {
    this.chunks = [];
    this.lastFlushIndex = 0;
  }
}
