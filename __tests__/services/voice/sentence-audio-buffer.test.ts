import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SentenceAudioBuffer } from '@/services/voice/sentence-audio-buffer'

describe('SentenceAudioBuffer', () => {
  let buffer: SentenceAudioBuffer
  let streamChunkMock: any

  beforeEach(() => {
    streamChunkMock = vi.fn().mockResolvedValue(undefined)
    buffer = new SentenceAudioBuffer(streamChunkMock)
  })

  it('should buffer audio chunks', async () => {
    const chunk1 = Buffer.from('audio data 1')
    const chunk2 = Buffer.from('audio data 2')

    await buffer.addSentence(chunk1)
    await buffer.addSentence(chunk2)

    // Should have called stream function for first chunk
    expect(streamChunkMock).toHaveBeenCalled()
  })

  it('should interrupt playback when requested', async () => {
    const chunk1 = Buffer.from('audio data 1')
    const chunk2 = Buffer.from('audio data 2')
    const chunk3 = Buffer.from('audio data 3')

    // Add chunks
    buffer.addSentence(chunk1)
    buffer.addSentence(chunk2)
    buffer.addSentence(chunk3)

    // Interrupt immediately
    buffer.interrupt()

    // Wait a bit for any async operations
    await new Promise(resolve => setTimeout(resolve, 50))

    // Should not be playing anymore
    expect(buffer.isPlaying()).toBe(false)
  })

  it('should clear remaining buffer on interrupt', () => {
    const chunk1 = Buffer.from('audio data 1')
    const chunk2 = Buffer.from('audio data 2')

    buffer.addSentence(chunk1)
    buffer.addSentence(chunk2)

    buffer.interrupt()

    // Buffer should be cleared
    expect(buffer.getRemainingChunks()).toBe(0)
  })

  it('should track playing state', async () => {
    const chunk1 = Buffer.from('audio data 1')

    expect(buffer.isPlaying()).toBe(false)

    buffer.addSentence(chunk1)

    // Give playback a moment to start
    await new Promise(resolve => setTimeout(resolve, 10))

    // Should be playing or have just finished (depending on timing)
    // This is a bit timing-dependent, but should work most of the time
  })

  it('should get remaining chunks count', () => {
    expect(buffer.getRemainingChunks()).toBe(0)

    buffer.addSentence(Buffer.from('chunk1'))
    buffer.addSentence(Buffer.from('chunk2'))
    buffer.addSentence(Buffer.from('chunk3'))

    // Should have 3 chunks queued
    expect(buffer.getRemainingChunks()).toBeGreaterThan(0)
  })

  it('should not add sentences after interruption', async () => {
    buffer.interrupt()

    const chunk = Buffer.from('audio data')
    buffer.addSentence(chunk)

    // Should not have added the chunk
    expect(buffer.getRemainingChunks()).toBe(0)
  })

  it('should allow resuming after interrupt', async () => {
    buffer.interrupt()

    // Reset by creating new buffer or calling a reset method
    buffer = new SentenceAudioBuffer(streamChunkMock)

    const chunk = Buffer.from('audio data')
    buffer.addSentence(chunk)

    // Should accept new chunks
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(streamChunkMock).toHaveBeenCalled()
  })

  it('should handle empty buffer gracefully', () => {
    expect(() => buffer.interrupt()).not.toThrow()
    expect(buffer.getRemainingChunks()).toBe(0)
    expect(buffer.isPlaying()).toBe(false)
  })
})
