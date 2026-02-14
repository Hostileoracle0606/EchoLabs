import { describe, it, expect } from 'vitest';
import { TranscriptStore } from './transcript-store';

describe('TranscriptStore', () => {
  it('adds and retrieves transcript chunks', () => {
    const store = new TranscriptStore();
    const chunk = store.addChunk('session-1', 'call-1', {
      text: 'Hello world',
      speaker: 'customer',
      isFinal: true,
      timestamp: 1000,
    });

    expect(chunk.schemaVersion).toBe(2);
    const chunks = store.getTranscript('session-1');
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe('Hello world');
  });

  it('returns rolling text within window', () => {
    const store = new TranscriptStore();
    store.addChunk('session-2', 'call-2', {
      text: 'Earlier',
      speaker: 'customer',
      isFinal: true,
      timestamp: Date.now() - 10000,
    });
    store.addChunk('session-2', 'call-2', {
      text: 'Recent',
      speaker: 'customer',
      isFinal: true,
      timestamp: Date.now(),
    });

    const rolling = store.getRollingText('session-2', 5000);
    expect(rolling).toContain('Recent');
    expect(rolling).not.toContain('Earlier');
  });
});
