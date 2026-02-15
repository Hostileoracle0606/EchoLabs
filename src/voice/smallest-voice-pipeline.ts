import { EventEmitter } from 'events';
import WebSocket from 'ws';
import type { TranscriptSpeaker } from '@/types/transcript';

export interface SmallestVoiceConfig {
  apiKey?: string;
  region?: string;
  ttsSampleRate?: number;
}

export interface VoiceSessionConfig {
  sessionId: string;
  phoneNumber?: string;
  voiceId?: string;
  sttModel?: string;
  language?: string;
}

export interface VoiceSynthesisOptions {
  emotion?: 'neutral' | 'enthusiastic' | 'empathetic' | 'confident';
  urgency?: number;
  emphasize?: string[];
}

export interface TranscriptEvent {
  sessionId: string;
  speaker: TranscriptSpeaker;
  speakerId?: number;
  text: string;
  isFinal: boolean;
  confidence?: number;
  timestamp: number;
  words?: any[];
  utterances?: any[];
  fullTranscript?: string;
  language?: string;
  languages?: string[];
}

export interface VoicePipelineEvents {
  partial_transcript: (event: TranscriptEvent) => void;
  final_transcript: (event: TranscriptEvent) => void;
  end_of_speech: (event: { sessionId: string }) => void;
  interrupted: (event: { sessionId: string }) => void;
  error: (event: { sessionId: string; message: string }) => void;
}

type RuntimeSession = {
  cfg: VoiceSessionConfig;
  sttWs: WebSocket;
  ttsWs?: WebSocket;
};

export class SmallestVoicePipeline extends EventEmitter {
  private config: SmallestVoiceConfig;
  private sessions = new Map<string, RuntimeSession>();
  // Waves TTS concurrency limit: 1 active request across all connections.
  private static ttsGate = new ConcurrencyGate(1);

  constructor(config: SmallestVoiceConfig = {}) {
    super();
    this.config = config;
  }

  async startConversation(
    sessionId: string,
    phoneNumber?: string,
    options: Partial<VoiceSessionConfig> = {}
  ) {
    const cfg: VoiceSessionConfig = {
      sessionId,
      phoneNumber,
      voiceId: options.voiceId ?? 'professional-sales-neutral',
      sttModel: options.sttModel ?? 'lightning',
      language: options.language ?? 'en',
    };

    const runtime: RuntimeSession = {
      cfg,
      sttWs: null as unknown as WebSocket,
    };
    this.sessions.set(sessionId, runtime);
    const sttWs = this.createPulseSttSocket(runtime);
    runtime.sttWs = sttWs;
    return cfg;
  }

  async transcribeAudioChunk(sessionId: string, audio: Buffer) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.sttWs.readyState === WebSocket.OPEN) {
      session.sttWs.send(audio, { binary: true });
    }
  }

  async synthesize(
    sessionId: string,
    text: string,
    _options?: VoiceSynthesisOptions
  ): Promise<ReadableStream<Uint8Array> | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (session.ttsWs) {
      session.ttsWs.close();
      session.ttsWs = undefined;
      this.emit('interrupted', { sessionId });
    }

    // Enforce Waves TTS concurrency (1 active request across all sessions).
    const release = await SmallestVoicePipeline.ttsGate.acquire();

    let ws: WebSocket;
    try {
      ws = new WebSocket(
        'wss://waves-api.smallest.ai/api/v1/lightning-v3.1/get_speech/stream?timeout=60',
        { headers: { Authorization: `Bearer ${this.getApiKey()}` } }
      );
    } catch (err) {
      release();
      throw err;
    }

    session.ttsWs = ws;

    let done = false;
    let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
    const finalize = (err?: unknown) => {
      if (done) return;
      done = true;
      release();
      if (err && controllerRef) {
        controllerRef.error(err);
        return;
      }
      controllerRef?.close();
    };

    const connectionTimeoutMs = 15000;
    const requestTimeoutMs = 65000;
    const sampleRate =
      this.config.ttsSampleRate ||
      Number.parseInt(process.env.SMALLEST_TTS_SAMPLE_RATE ?? '', 10) ||
      44100;
    let connectionTimer: NodeJS.Timeout | null = setTimeout(() => {
      finalize(new Error('TTS connection timeout'));
      try {
        ws.close();
      } catch {
        // ignore
      }
    }, connectionTimeoutMs);
    let requestTimer: NodeJS.Timeout | null = setTimeout(() => {
      finalize(new Error('TTS request timeout'));
      try {
        ws.close();
      } catch {
        // ignore
      }
    }, requestTimeoutMs);

    const clearTimers = () => {
      if (connectionTimer) {
        clearTimeout(connectionTimer);
        connectionTimer = null;
      }
      if (requestTimer) {
        clearTimeout(requestTimer);
        requestTimer = null;
      }
    };

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        controllerRef = controller;

        ws.on('error', (err) => {
          clearTimers();
          finalize(err);
        });

        ws.on('close', () => {
          clearTimers();
          finalize();
        });

        ws.on('open', () => {
          if (connectionTimer) {
            clearTimeout(connectionTimer);
            connectionTimer = null;
          }
          ws.send(
            JSON.stringify({
              voice_id: session.cfg.voiceId,
              text,
              // Lightning v3.1 is a 44 kHz model by default.
              sample_rate: sampleRate,
              speed: 1,
            })
          );
        });

        ws.on('message', (data) => {
          let msg: any;
          try {
            msg = JSON.parse(data.toString());
          } catch {
            return;
          }

          const status = msg.status || msg.event || msg.type;
          const audioBase64 =
            msg?.data?.audio || msg?.audio || msg?.chunk || msg?.payload?.audio;

          if (status === 'chunk' && audioBase64) {
            controller.enqueue(Buffer.from(audioBase64, 'base64'));
          } else if (audioBase64 && (status === 'audio' || status === 'data')) {
            controller.enqueue(Buffer.from(audioBase64, 'base64'));
          }

          if (status === 'complete' || msg.done) {
            clearTimers();
            finalize();
            ws.close();
          }
        });
      },
      cancel: () => {
        try {
          ws.close();
        } catch {
          // Ignore close errors
        }
        clearTimers();
        finalize();
      }
    });
  }

  async handleInterrupt(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session?.ttsWs) return;

    session.ttsWs.close();
    session.ttsWs = undefined;
    this.emit('interrupted', { sessionId });
  }

  async endConversation(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.sttWs.readyState === WebSocket.OPEN) {
      session.sttWs.send(JSON.stringify({ type: 'end' }));
      session.sttWs.close();
    } else {
      session.sttWs.close();
    }

    if (session.ttsWs) session.ttsWs.close();

    this.sessions.delete(sessionId);
  }

  private getApiKey(): string {
    const key =
      this.config.apiKey ||
      process.env.SMALLEST_API_KEY ||
      process.env.SMALLESTAI_API_KEY;
    if (!key) {
      throw new Error('SMALLEST_API_KEY not set');
    }
    return key;
  }

  private createPulseSttSocket(session: RuntimeSession): WebSocket {
    const cfg = session.cfg;
    const url = new URL('wss://waves-api.smallest.ai/api/v1/pulse/get_text');

    url.searchParams.set('language', cfg.language ?? 'en');
    url.searchParams.set('encoding', 'linear16');
    url.searchParams.set('sample_rate', '16000');
    url.searchParams.set('word_timestamps', 'true');
    url.searchParams.set('sentence_timestamps', 'true');
    url.searchParams.set('diarize', 'true');
    url.searchParams.set('full_transcript', 'false');

    const ws = new WebSocket(url.toString(), {
      headers: { Authorization: `Bearer ${this.getApiKey()}` },
    });

    ws.on('message', (data) => {
      const raw = data.toString();
      let msg: any;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      if (!msg.transcript) return;

      const isFinal = Boolean(msg.is_final);
      const speakerId = this.getSingleSpeakerId(msg);
      const event = {
        sessionId: cfg.sessionId,
        speaker: 'system' as TranscriptSpeaker,
        speakerId,
        text: msg.transcript,
        isFinal,
        timestamp: Date.now(),
        confidence: msg.confidence,
        words: Array.isArray(msg.words) ? msg.words : undefined,
        utterances: Array.isArray(msg.utterances) ? msg.utterances : undefined,
        fullTranscript: typeof msg.full_transcript === 'string' ? msg.full_transcript : undefined,
        language: typeof msg.language === 'string' ? msg.language : undefined,
        languages: Array.isArray(msg.languages) ? msg.languages : undefined,
      };

      if (isFinal) {
        this.emit('final_transcript', event);
        this.emit('end_of_speech', { sessionId: cfg.sessionId });
      } else {
        this.emit('partial_transcript', event);
      }
    });

    ws.on('error', (err) => {
      this.emit('error', {
        sessionId: cfg.sessionId,
        message: String(err),
      });
    });

    return ws;
  }

  private getSingleSpeakerId(msg: any): number | undefined {
    const ids = new Set<number>();

    if (typeof msg?.speaker === 'number') {
      ids.add(msg.speaker);
    }

    if (Array.isArray(msg?.utterances)) {
      for (const utterance of msg.utterances) {
        if (typeof utterance?.speaker === 'number') {
          ids.add(utterance.speaker);
        }
      }
    }

    if (Array.isArray(msg?.words)) {
      for (const word of msg.words) {
        if (typeof word?.speaker === 'number') {
          ids.add(word.speaker);
        }
      }
    }

    if (ids.size === 1) {
      return Array.from(ids)[0];
    }

    return undefined;
  }
}

class ConcurrencyGate {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(private limit: number) {}

  async acquire(): Promise<() => void> {
    if (this.active < this.limit) {
      this.active += 1;
      return () => this.release();
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1;
        resolve(() => this.release());
      });
    });
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1);
    const next = this.queue.shift();
    if (next) next();
  }
}
