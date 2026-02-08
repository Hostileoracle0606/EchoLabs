export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  isFinal: boolean;
}

export interface TranscriptChunk {
  text: string;
  words: TranscriptWord[];
  timestamp: number;
  isFinal: boolean;
}

export interface TranscriptBuffer {
  chunks: TranscriptChunk[];
  fullText: string;
  lastSentAt: number;
  sessionId: string;
}
