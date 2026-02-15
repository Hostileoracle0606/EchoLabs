import { generateClientMd } from '@/services/crm/client-md-generator';
import { setClientMd, clearClientMdForCall, clearClientMdForSession } from '@/services/crm/client-md-store';
import { SmallestVoicePipeline } from '@/voice/smallest-voice-pipeline';
import { broadcast } from '@/websocket/ws-server';
import { processSalesTranscript } from '@/services/sales/sales-orchestrator';
import type { CallSessionMetadata } from '@/types/sales';

interface VoiceSessionState extends CallSessionMetadata {
  isStreaming: boolean;
}

export class VoiceSessionManager {
  private pipeline: SmallestVoicePipeline;
  private sessions = new Map<string, VoiceSessionState>();

  constructor(pipeline: SmallestVoicePipeline) {
    this.pipeline = pipeline;

    this.pipeline.on('partial_transcript', (event) => {
      const session = this.sessions.get(event.sessionId);
      if (!session) return;
      broadcast('transcript:update', event.sessionId, {
        schemaVersion: 2,
        callId: session.callId,
        sessionId: event.sessionId,
        speaker: event.speaker,
        speakerId: event.speakerId,
        text: event.text,
        isFinal: false,
        timestamp: event.timestamp,
        confidence: event.confidence,
        words: event.words,
        utterances: event.utterances,
        fullTranscript: event.fullTranscript,
        language: event.language,
        languages: event.languages,
      });
    });

    this.pipeline.on('final_transcript', async (event) => {
      const session = this.sessions.get(event.sessionId);
      if (!session) return;
      broadcast('transcript:update', event.sessionId, {
        schemaVersion: 2,
        callId: session.callId,
        sessionId: event.sessionId,
        speaker: event.speaker,
        speakerId: event.speakerId,
        text: event.text,
        isFinal: true,
        timestamp: event.timestamp,
        confidence: event.confidence,
        words: event.words,
        utterances: event.utterances,
        fullTranscript: event.fullTranscript,
        language: event.language,
        languages: event.languages,
      });
      void processSalesTranscript({
        sessionId: event.sessionId,
        callId: session.callId,
        text: event.text,
        speaker: event.speaker,
        timestamp: event.timestamp,
        emitTranscript: false,
      }).catch((err) => {
        console.error('[VoiceSessionManager] Failed to process sales transcript:', err);
      });
    });

    this.pipeline.on('error', (event) => {
      broadcast('voice:status', event.sessionId, {
        schemaVersion: 2,
        callId: this.sessions.get(event.sessionId)?.callId ?? event.sessionId,
        sessionId: event.sessionId,
        status: 'error',
        message: event.message,
      });
    });
  }

  async startSession(
    metadata: Omit<CallSessionMetadata, 'schemaVersion' | 'startedAt'>
  ) {
    const state: VoiceSessionState = {
      schemaVersion: 2,
      callId: metadata.callId,
      sessionId: metadata.sessionId,
      customerId: metadata.customerId,
      phoneNumber: metadata.phoneNumber,
      startedAt: Date.now(),
      isStreaming: true,
    };
    this.sessions.set(metadata.sessionId, state);
    await this.pipeline.startConversation(metadata.sessionId, metadata.phoneNumber);

    void generateClientMd({
      callId: metadata.callId,
      contactId: metadata.customerId,
    })
      .then((clientMd) => {
        setClientMd({
          callId: metadata.callId,
          sessionId: metadata.sessionId,
          content: clientMd,
        });
      })
      .catch((err) => {
        console.error('[VoiceSessionManager] CLIENT.md generation failed:', err);
      });

    broadcast('voice:status', metadata.sessionId, {
      schemaVersion: 2,
      callId: metadata.callId,
      sessionId: metadata.sessionId,
      status: 'connected',
    });
  }

  async handleAudioChunk(sessionId: string, chunk: Buffer) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    await this.pipeline.transcribeAudioChunk(sessionId, chunk);
  }

  async stopSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.isStreaming = false;
    await this.pipeline.endConversation(sessionId);
    broadcast('voice:status', sessionId, {
      schemaVersion: 2,
      callId: session.callId,
      sessionId,
      status: 'stopped',
    });
    this.sessions.delete(sessionId);

    clearClientMdForCall(session.callId);
    clearClientMdForSession(sessionId);
  }

  async interruptSession(sessionId: string) {
    if (!this.sessions.has(sessionId)) return;
    await this.pipeline.handleInterrupt(sessionId);
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}

const globalForVoice = global as unknown as { voiceSessionManager?: VoiceSessionManager };

export function getVoiceSessionManager(): VoiceSessionManager {
  if (!globalForVoice.voiceSessionManager) {
    globalForVoice.voiceSessionManager = new VoiceSessionManager(
      new SmallestVoicePipeline({
        apiKey: process.env.SMALLEST_API_KEY,
        region: process.env.SMALLEST_REGION || 'us-west-2',
      })
    );
  }
  return globalForVoice.voiceSessionManager;
}
