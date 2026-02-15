import { getVoiceSessionManager } from '@/services/voice/voice-session-manager'

/**
 * VapiSessionBridge
 * Bridges Vapi webhook events to the existing voice pipeline
 * 
 * Responsibilities:
 * 1. Map Vapi call.id to internal sessionId
 * 2. Forward transcripts to VoiceSessionManager
 * 3. Route TTS output back to Vapi
 * 4. Manage session lifecycle (start/stop)
 */
export class VapiSessionBridge {
    private callToSessionMap = new Map<string, string>()
    private sessionToCallMap = new Map<string, string>()

    /**
     * Start a new voice session for a Vapi call
     */
    async startSession(params: {
        callId: string
        phoneNumber?: string
        customerId?: string
    }) {
        const sessionId = `vapi-${params.callId}`

        // Store bi-directional mapping
        this.callToSessionMap.set(params.callId, sessionId)
        this.sessionToCallMap.set(sessionId, params.callId)

        // Initialize voice session
        const voiceSessionManager = getVoiceSessionManager()

        await voiceSessionManager.startSession({
            callId: params.callId,
            sessionId,
            customerId: params.customerId || 'unknown',
            phoneNumber: params.phoneNumber || 'unknown',
        })

        console.log('[VapiSessionBridge] Started session:', {
            callId: params.callId,
            sessionId,
        })

        return sessionId
    }

    /**
     * Process a transcript from Vapi
     * Forwards to VoiceSessionManager → WorkflowController pipeline
     */
    async processTranscript(params: {
        callId: string
        transcript: string
        role: 'user' | 'assistant'
        isFinal: boolean
    }) {
        const sessionId = this.callToSessionMap.get(params.callId)

        if (!sessionId) {
            console.warn('[VapiSessionBridge] No session found for call:', params.callId)
            return
        }

        // Only process user transcripts (not echoing our own responses)
        if (params.role !== 'user') {
            return
        }

        // Only process final transcripts
        if (!params.isFinal) {
            return
        }

        console.log('[VapiSessionBridge] Processing transcript:', {
            callId: params.callId,
            sessionId,
            text: params.transcript,
        })

        // TODO: Forward to VoiceSessionManager
        // This will eventually trigger:
        // 1. ThreadMemory update
        // 2. WorkflowController.processTranscript()
        // 3. LLM response generation
        // 4. TTS synthesis
        // 5. Audio output back to Vapi (via sendAudioToVapi)
    }

    /**
     * Send TTS audio back to Vapi for playback
     * Called by TTS pipeline when response audio is ready
     */
    async sendAudioToVapi(params: {
        sessionId: string
        audio: Buffer
    }) {
        const callId = this.sessionToCallMap.get(params.sessionId)

        if (!callId) {
            console.warn('[VapiSessionBridge] No call found for session:', params.sessionId)
            return
        }

        console.log('[VapiSessionBridge] Sending audio to Vapi:', {
            callId,
            audioSize: params.audio.length,
        })

        // TODO: Use Vapi SDK to stream audio back
        // This depends on Vapi's audio streaming API
        // May require WebSocket or chunked HTTP streaming
    }

    /**
     * Stop a voice session
     */
    async stopSession(callId: string) {
        const sessionId = this.callToSessionMap.get(callId)

        if (!sessionId) {
            console.warn('[VapiSessionBridge] No session found for call:', callId)
            return
        }

        console.log('[VapiSessionBridge] Stopping session:', {
            callId,
            sessionId,
        })

        // Clean up voice session
        const voiceSessionManager = getVoiceSessionManager()
        await voiceSessionManager.stopSession(sessionId)

        // Remove mappings
        this.callToSessionMap.delete(callId)
        this.sessionToCallMap.delete(sessionId)

    }

    /**
     * Get session ID for a call
     */
    getSessionId(callId: string): string | undefined {
        return this.callToSessionMap.get(callId)
    }

    /**
     * Get call ID for a session
     */
    getCallId(sessionId: string): string | undefined {
        return this.sessionToCallMap.get(sessionId)
    }
}

// Singleton instance
const globalForBridge = global as unknown as { vapiSessionBridge?: VapiSessionBridge }

export function getVapiSessionBridge(): VapiSessionBridge {
    if (!globalForBridge.vapiSessionBridge) {
        globalForBridge.vapiSessionBridge = new VapiSessionBridge()
    }
    return globalForBridge.vapiSessionBridge
}
