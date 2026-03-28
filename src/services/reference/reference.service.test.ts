import { describe, it, expect, vi, afterEach } from 'vitest';
import { findReferences } from './reference.service';

describe('ReferenceService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns no sources until grounded retrieval is implemented', async () => {
    const result = await findReferences({
      intent: {
        type: 'REFERENCE',
        confidence: 0.88,
        excerpt: "according to McKinsey's latest AI report",
        priority: 7,
      },
      context: 'discussing AI adoption trends',
      sessionId: 'test-session',
    });

    expect(result.sources).toHaveLength(0);
  });

  it('returns the search query used', async () => {
    const result = await findReferences({
      intent: {
        type: 'REFERENCE',
        confidence: 0.88,
        excerpt: "McKinsey's latest AI report",
        priority: 7,
      },
      context: 'AI discussion',
      sessionId: 'test-session',
    });

    expect(result.query).toBeTruthy();
  });

  it('returns no sources in non-mock mode', async () => {
    const result = await findReferences({
      intent: {
        type: 'REFERENCE',
        confidence: 0.8,
        excerpt: 'some reference',
        priority: 7,
      },
      context: 'test',
      sessionId: 'test-session',
    });

    expect(result.sources).toHaveLength(0);
  });

  it('returns mock references when MOCK_MODE is enabled', async () => {
    vi.stubEnv('MOCK_MODE', 'true');

    const result = await findReferences({
      intent: {
        type: 'REFERENCE',
        confidence: 0.8,
        excerpt: 'some reference',
        priority: 7,
      },
      context: 'test',
      sessionId: 'test-session',
    });

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].url).toBe('https://example.com/mock-reference');
    expect(result.sources[0].domain).toBe('example.com');
  });

  it('keeps returning the query even without sources', async () => {
    const result = await findReferences({
      intent: {
        type: 'REFERENCE',
        confidence: 0.9,
        excerpt: 'McKinsey report',
        priority: 7,
      },
      context: 'discussion',
      sessionId: 'test-session',
    });

    expect(result.query).toBe('McKinsey report');
  });
});
