/**
 * SentenceAudioBuffer
 * Buffers TTS output by sentence for natural, interruptible speech
 *
 * Key features:
 * - Sequential playback of audio chunks (sentences)
 * - Interruptible mid-playback (customer barge-in)
 * - Natural pauses between sentences
 * - Automatic buffer clearing on interrupt
 */
export class SentenceAudioBuffer {
  private buffer: Buffer[] = []
  private isPlayingFlag = false
  private currentSentenceIndex = 0
  private interrupted = false
  private streamChunk: (chunk: Buffer) => Promise<void>

  constructor(streamChunk: (chunk: Buffer) => Promise<void>) {
    this.streamChunk = streamChunk
  }

  /**
   * Add a sentence audio chunk to the buffer
   * Starts playback if not already playing
   */
  addSentence(audioChunk: Buffer): void {
    if (this.interrupted) {
      return // Don't add if interrupted
    }

    this.buffer.push(audioChunk)

    if (!this.isPlayingFlag) {
      this.startPlayback()
    }
  }

  /**
   * Start sequential playback of buffered chunks
   * Runs asynchronously in background
   */
  private async startPlayback(): Promise<void> {
    this.isPlayingFlag = true

    while (this.currentSentenceIndex < this.buffer.length && !this.interrupted) {
      const chunk = this.buffer[this.currentSentenceIndex]

      try {
        // Stream to output (Vapi or browser)
        await this.streamChunk(chunk)
      } catch (error) {
        console.error('Error streaming audio chunk:', error)
        // Continue to next chunk even if one fails
      }

      this.currentSentenceIndex++

      // Small gap between sentences for natural speech (100ms)
      if (this.currentSentenceIndex < this.buffer.length && !this.interrupted) {
        await this.sleep(100)
      }
    }

    this.isPlayingFlag = false
    this.reset()
  }

  /**
   * Interrupt playback (customer barge-in)
   * Immediately stops playback and clears remaining buffer
   */
  interrupt(): void {
    this.interrupted = true
    this.clearRemaining()
  }

  /**
   * Clear any queued audio chunks
   */
  private clearRemaining(): void {
    this.buffer = []
    this.currentSentenceIndex = 0
  }

  /**
   * Reset buffer state after playback completes
   */
  private reset(): void {
    this.buffer = []
    this.currentSentenceIndex = 0
    this.interrupted = false
  }

  /**
   * Check if currently playing audio
   */
  isPlaying(): boolean {
    return this.isPlayingFlag
  }

  /**
   * Get number of remaining chunks in buffer
   */
  getRemainingChunks(): number {
    return Math.max(0, this.buffer.length - this.currentSentenceIndex)
  }

  /**
   * Sleep helper for inter-sentence pauses
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
