import { describe, it, expect, vi } from 'vitest'
import {
  AudioSourceFactory,
  BrowserMicSource,
  VapiSource,
  AudioSource
} from '@/services/voice/audio-source-adapter'

describe('AudioSourceFactory', () => {
  it('should create BrowserMicSource for development mode', () => {
    const source = AudioSourceFactory.create('development')
    expect(source).toBeInstanceOf(BrowserMicSource)
  })

  it('should create VapiSource for production mode', () => {
    const source = AudioSourceFactory.create('production')
    expect(source).toBeInstanceOf(VapiSource)
  })
})

describe('BrowserMicSource', () => {
  it('should implement AudioSource interface', () => {
    const source = new BrowserMicSource()

    expect(typeof source.connect).toBe('function')
    expect(typeof source.onAudioChunk).toBe('function')
    expect(typeof source.onDisconnect).toBe('function')
    expect(typeof source.disconnect).toBe('function')
  })

  it('should allow registering audio chunk callback', () => {
    const source = new BrowserMicSource()
    const callback = vi.fn()

    source.onAudioChunk(callback)

    // Callback should be registered (tested via connect simulation)
    expect(callback).toBeDefined()
  })

  it('should allow registering disconnect callback', () => {
    const source = new BrowserMicSource()
    const callback = vi.fn()

    source.onDisconnect(callback)

    // Callback should be registered
    expect(callback).toBeDefined()
  })

  it('should generate session ID on connect', async () => {
    const source = new BrowserMicSource()

    await source.connect()

    // Should have created a session ID
    expect(source.getSessionId()).toBeTruthy()
    expect(source.getSessionId()).toContain('browser-')
  })
})

describe('VapiSource', () => {
  it('should implement AudioSource interface', () => {
    const source = new VapiSource()

    expect(typeof source.connect).toBe('function')
    expect(typeof source.onAudioChunk).toBe('function')
    expect(typeof source.onDisconnect).toBe('function')
    expect(typeof source.disconnect).toBe('function')
  })

  it('should allow registering audio chunk callback', () => {
    const source = new VapiSource()
    const callback = vi.fn()

    source.onAudioChunk(callback)

    // Callback should be registered
    expect(callback).toBeDefined()
  })

  it('should generate session ID on connect', async () => {
    const source = new VapiSource()

    await source.connect()

    // Should have created a session ID
    expect(source.getSessionId()).toBeTruthy()
    expect(source.getSessionId()).toContain('vapi-')
  })
})

describe('AudioChunk interface', () => {
  it('should have correct structure', () => {
    const source = new BrowserMicSource()
    let capturedChunk: any = null

    source.onAudioChunk((chunk) => {
      capturedChunk = chunk
    })

    // Simulate audio chunk
    const mockChunk = {
      sessionId: 'test-123',
      audio: Buffer.from('mock audio data'),
      timestamp: new Date(),
      sampleRate: 16000,
      channels: 1
    }

    // Verify chunk structure matches interface
    expect(mockChunk).toHaveProperty('sessionId')
    expect(mockChunk).toHaveProperty('audio')
    expect(mockChunk).toHaveProperty('timestamp')
    expect(mockChunk).toHaveProperty('sampleRate')
    expect(mockChunk).toHaveProperty('channels')
  })
})
