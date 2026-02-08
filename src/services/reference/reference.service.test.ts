import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findReferences } from './reference.service';
import { GEMINI_REFERENCE_RESPONSE } from '../../../__tests__/fixtures/gemini-responses';

vi.mock('../gemini/gemini.client', () => ({
  geminiGenerate: vi.fn(),
}));

describe('ReferenceService', () => {
  let mockGeminiGenerate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const geminiModule = await import('../gemini/gemini.client');
    mockGeminiGenerate = vi.mocked(geminiModule.geminiGenerate);
  });

  it('finds a verified source for a McKinsey reference', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_REFERENCE_RESPONSE));

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

    expect(result.sources).toHaveLength(1);
    expect(result.sources[0].title).toContain('McKinsey');
    expect(result.sources[0].url).toContain('mckinsey.com');
    expect(result.sources[0].confidence).toBe('verified');
    expect(result.sources[0].snippet).toBeTruthy();
  });

  it('returns the search query used', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_REFERENCE_RESPONSE));

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

  it('handles malformed Gemini response gracefully', async () => {
    mockGeminiGenerate.mockResolvedValue('invalid json response');

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

  it('handles Gemini API failure gracefully', async () => {
    mockGeminiGenerate.mockRejectedValue(new Error('API error'));

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
    expect(result.query).toBeTruthy();
  });

  it('extracts domain from URL', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_REFERENCE_RESPONSE));

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

    expect(result.sources[0].domain).toBe('mckinsey.com');
  });
});
