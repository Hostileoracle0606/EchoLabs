import { EventEmitter } from 'events';
import WebSocket from 'ws';
import type { TranscriptSpeaker } from '@/types/transcript';

export interface SmallestVoiceConfig {
  apiKey?: string;
  region?: string;
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

    const ws = new WebSocket(
      'wss://waves-api.smallest.ai/api/v1/lightning-v2/get_speech/stream?timeout=60',
      { headers: { Authorization: `Bearer ${this.getApiKey()}` } }
    );

    session.ttsWs = ws;

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        let done = false;
        const closeOnce = () => {
          if (done) return;
          done = true;
          controller.close();
        };
        const errorOnce = (err: unknown) => {
          if (done) return;
          done = true;
          controller.error(err);
        };

        ws.on('open', () => {
          ws.send(
            JSON.stringify({
              voice_id: session.cfg.voiceId,
              text,
              sample_rate: 24000,
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

          if (msg.status === 'chunk') {
            controller.enqueue(Buffer.from(msg.data.audio, 'base64'));
          }

          if (msg.status === 'complete' || msg.done) {
            closeOnce();
            ws.close();
          }
        });

        ws.on('error', (err) => {
          errorOnce(err);
        });

        ws.on('close', () => {
          closeOnce();
        });
      },
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
