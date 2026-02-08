import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranscriptBufferManager } from './transcript-buffer';

describe('TranscriptBufferManager', () => {
  let buffer: TranscriptBufferManager;

  beforeEach(() => {
    buffer = new TranscriptBufferManager('test-session');
  });

  it('starts with empty state', () => {
    expect(buffer.getFullText()).toBe('');
    expect(buffer.getUnsentText()).toBe('');
    expect(buffer.getChunkCount()).toBe(0);
  });

  it('accumulates final transcript chunks', () => {
    buffer.addChunk('Hello world.', true);
    buffer.addChunk('How are you?', true);

    expect(buffer.getFullText()).toBe('Hello world. How are you?');
    expect(buffer.getChunkCount()).toBe(2);
  });

  it('tracks unsent text since last flush', () => {
    buffer.addChunk('First sentence.', true);
    buffer.addChunk('Second sentence.', true);

    const unsent = buffer.flushUnsent();
    expect(unsent).toBe('First sentence. Second sentence.');

    buffer.addChunk('Third sentence.', true);
    const unsent2 = buffer.flushUnsent();
    expect(unsent2).toBe('Third sentence.');
  });

  it('returns empty string when flushing with nothing new', () => {
    buffer.addChunk('Something.', true);
    buffer.flushUnsent();
    expect(buffer.flushUnsent()).toBe('');
  });

  it('ignores non-final chunks in full text accumulation', () => {
    buffer.addChunk('partial interim text', false);
    expect(buffer.getFullText()).toBe('');
    expect(buffer.getChunkCount()).toBe(0);
  });

  it('provides rolling transcript (last N seconds worth of text)', () => {
    const now = Date.now();
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(now - 120000) // 2 min ago
      .mockReturnValueOnce(now - 60000)  // 1 min ago
      .mockReturnValueOnce(now - 10000)  // 10 sec ago
      .mockReturnValue(now);

    buffer.addChunk('Old text.', true);
    buffer.addChunk('Medium text.', true);
    buffer.addChunk('Recent text.', true);

    // Rolling 30 seconds should only include the recent text
    const rolling = buffer.getRollingTranscript(30000);
    expect(rolling).toContain('Recent text.');
    expect(rolling).not.toContain('Old text.');
  });

  it('provides full text regardless of age', () => {
    buffer.addChunk('Sentence one.', true);
    buffer.addChunk('Sentence two.', true);
    buffer.addChunk('Sentence three.', true);

    expect(buffer.getFullText()).toContain('Sentence one.');
    expect(buffer.getFullText()).toContain('Sentence three.');
  });

  it('resets properly', () => {
    buffer.addChunk('Some text.', true);
    buffer.reset();

    expect(buffer.getFullText()).toBe('');
    expect(buffer.getChunkCount()).toBe(0);
  });
});
