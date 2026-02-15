export interface AudioChunk {
  sessionId: string
  audio: Buffer
  timestamp: Date
  sampleRate: number
  channels: number
}

export interface AudioSource {
  connect(): Promise<void>
  onAudioChunk(callback: (chunk: AudioChunk) => void): void
  onDisconnect(callback: () => void): void
  disconnect(): Promise<void>
  getSessionId(): string
}

/**
 * BrowserMicSource
 * Development mode - uses browser microphone via WebSocket
 */
export class BrowserMicSource implements AudioSource {
  private wsConnection: any = null
  private sessionId: string = ''
  private audioCallback?: (chunk: AudioChunk) => void
  private disconnectCallback?: () => void

  async connect(): Promise<void> {
    // Browser mic WebSocket logic (existing implementation from temp_momentum)
    // For now, generate session ID
    this.sessionId = `browser-${Date.now()}`
  }

  onAudioChunk(callback: (chunk: AudioChunk) => void): void {
    this.audioCallback = callback
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback
  }

  async disconnect(): Promise<void> {
    this.wsConnection?.close()
    this.disconnectCallback?.()
  }

  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Handle incoming audio data from WebSocket
   * Called by WebSocket message handler
   */
  protected handleAudioData(data: Buffer): void {
    if (this.audioCallback && this.sessionId) {
      this.audioCallback({
        sessionId: this.sessionId,
        audio: data,
        timestamp: new Date(),
        sampleRate: 16000, // Browser mic default
        channels: 1
      })
    }
  }
}

/**
 * VapiSource
 * Production mode - uses Vapi telephony
 * 
 * Design notes:
 * - Unlike browser mic, Vapi audio is server-side webhook driven
 * - Audio input comes via webhook events, not WebSocket chunks
 * - Audio output is sent via Vapi's response mechanism
 * - Session management handled by VapiSessionBridge
 */
export class VapiSource implements AudioSource {
  private sessionId: string = ''
  private audioCallback?: (chunk: AudioChunk) => void
  private disconnectCallback?: () => void
  private callId?: string

  async connect(callId?: string): Promise<void> {
    // Vapi sessions are initiated by webhook, not by connect()
    // Store call ID for reference
    this.callId = callId
    this.sessionId = `vapi-${callId || Date.now()}`

    console.log('[VapiSource] Connected with session:', this.sessionId)
  }

  onAudioChunk(callback: (chunk: AudioChunk) => void): void {
    this.audioCallback = callback
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback
  }

  async disconnect(): Promise<void> {
    console.log('[VapiSource] Disconnecting session:', this.sessionId)
    this.disconnectCallback?.()
  }

  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Handle incoming audio from Vapi webhook
   * Called by VapiSessionBridge when audio events arrive
   */
  handleAudioFromVapi(audio: Buffer, metadata?: {
    sampleRate?: number
    channels?: number
  }): void {
    if (this.audioCallback && this.sessionId) {
      this.audioCallback({
        sessionId: this.sessionId,
        audio,
        timestamp: new Date(),
        sampleRate: metadata?.sampleRate || 8000,
        channels: metadata?.channels || 1
      })
    }
  }

  /**
   * Send TTS audio back to Vapi for playback
   * Called by voice pipeline when response audio is ready
   */
  async sendAudioToVapi(audio: Buffer): Promise<void> {
    if (!this.callId) {
      console.warn('[VapiSource] Cannot send audio - no call ID')
      return
    }

    console.log('[VapiSource] Sending audio to Vapi:', {
      callId: this.callId,
      audioSize: audio.length,
    })

    // TODO: Use Vapi SDK to stream audio back to caller
    // This may require:
    // 1. WebSocket connection to Vapi's media server
    // 2. HTTP chunked streaming
    // 3. Or returning audio in webhook response
    // Check Vapi docs for the correct approach
  }

  /**
   * Handle transcript from Vapi's built-in STT
   * Allows bypassing Smallest.ai STT in production
   */
  handleTranscriptFromVapi(transcript: string): void {
    console.log('[VapiSource] Received transcript from Vapi:', transcript)

    // TODO: Forward to voice pipeline
    // This bypasses Smallest.ai STT, using Vapi's built-in transcription instead
  }
}

/**
 * AudioSourceFactory
 * Creates the appropriate audio source based on environment
 */
export class AudioSourceFactory {
  static create(mode: 'development' | 'production'): AudioSource {
    return mode === 'development'
      ? new BrowserMicSource()
      : new VapiSource()
  }
}
