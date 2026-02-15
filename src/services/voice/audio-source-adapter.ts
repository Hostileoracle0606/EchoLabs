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
 */
export class VapiSource implements AudioSource {
  private vapiClient: any = null
  private sessionId: string = ''
  private audioCallback?: (chunk: AudioChunk) => void
  private disconnectCallback?: () => void

  async connect(): Promise<void> {
    // Vapi SDK initialization
    // For now, generate session ID
    this.sessionId = `vapi-${Date.now()}`

    // In production, this would initialize Vapi:
    // this.vapiClient = await createVapiConnection({
    //   apiKey: process.env.VAPI_API_KEY,
    //   onAudio: this.handleAudio.bind(this),
    //   onTranscript: this.handleTranscript.bind(this)
    // })
  }

  onAudioChunk(callback: (chunk: AudioChunk) => void): void {
    this.audioCallback = callback
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback
  }

  async disconnect(): Promise<void> {
    // Vapi cleanup
    this.vapiClient?.disconnect?.()
    this.disconnectCallback?.()
  }

  getSessionId(): string {
    return this.sessionId
  }

  /**
   * Handle audio from Vapi
   * Called by Vapi SDK
   */
  private handleAudio(audio: Buffer): void {
    if (this.audioCallback && this.sessionId) {
      this.audioCallback({
        sessionId: this.sessionId,
        audio,
        timestamp: new Date(),
        sampleRate: 8000, // Vapi default (telephony)
        channels: 1
      })
    }
  }

  /**
   * Handle transcript from Vapi
   * Vapi provides real-time transcription
   */
  private handleTranscript(transcript: string): void {
    // In production, this would emit transcript events
    // for voice-session-manager to consume
    console.log('Vapi transcript:', transcript)
  }
}

/**
 * AudioSourceFactory
 * Creates appropriate audio source based on environment
 */
export class AudioSourceFactory {
  static create(mode: 'development' | 'production'): AudioSource {
    return mode === 'development'
      ? new BrowserMicSource()
      : new VapiSource()
  }
}
