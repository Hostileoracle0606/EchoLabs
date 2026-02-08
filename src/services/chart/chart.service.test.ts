import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChart } from './chart.service';
import {
  GEMINI_CHART_MERMAID_RESPONSE,
  GEMINI_CHART_BAR_RESPONSE,
  GEMINI_CHART_MINDMAP_RESPONSE,
} from '../../../__tests__/fixtures/gemini-responses';

vi.mock('../gemini/gemini.client', () => ({
  geminiGenerate: vi.fn(),
}));

describe('ChartService', () => {
  let mockGeminiGenerate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const geminiModule = await import('../gemini/gemini.client');
    mockGeminiGenerate = vi.mocked(geminiModule.geminiGenerate);
  });

  it('generates a pie chart from a revenue data claim', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_CHART_MERMAID_RESPONSE));

    const result = await generateChart({
      intent: {
        type: 'DATA_CLAIM',
        confidence: 0.95,
        excerpt: 'Revenue split: 40% enterprise, 35% SMB, 25% consumer',
        priority: 9,
      },
      context: 'discussing revenue distribution',
      sessionId: 'test-session',
    });

    expect(result.mermaidCode).toContain('pie');
    expect(result.chartType).toBe('pie');
    expect(result.narration).toBeTruthy();
  });

  it('generates a bar chart from hiring data', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_CHART_BAR_RESPONSE));

    const result = await generateChart({
      intent: {
        type: 'DATA_CLAIM',
        confidence: 0.9,
        excerpt: 'We hired 12 people in Q3, 8 in Q2, 5 in Q1',
        priority: 9,
      },
      context: 'discussing hiring',
      sessionId: 'test-session',
    });

    expect(result.mermaidCode).toContain('xychart-beta');
    expect(result.chartType).toBe('xychart-beta');
  });

  it('generates a mindmap from brainstorming', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_CHART_MINDMAP_RESPONSE));

    const result = await generateChart({
      intent: {
        type: 'DATA_CLAIM',
        confidence: 0.85,
        excerpt: 'AI strategy covers hiring and infrastructure',
        priority: 9,
      },
      context: 'AI strategy discussion',
      sessionId: 'test-session',
    });

    expect(result.mermaidCode).toContain('mindmap');
    expect(result.chartType).toBe('mindmap');
  });

  it('includes title in the response', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_CHART_MERMAID_RESPONSE));

    const result = await generateChart({
      intent: {
        type: 'DATA_CLAIM',
        confidence: 0.9,
        excerpt: 'revenue breakdown',
        priority: 9,
      },
      context: 'revenue discussion',
      sessionId: 'test-session',
    });

    expect(result.title).toBeTruthy();
  });

  it('calls Gemini with JSON mode for structured output', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_CHART_MERMAID_RESPONSE));

    await generateChart({
      intent: {
        type: 'DATA_CLAIM',
        confidence: 0.9,
        excerpt: 'test data',
        priority: 9,
      },
      context: 'test context',
      sessionId: 'test-session',
    });

    expect(mockGeminiGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonMode: true,
      })
    );
  });

  it('handles malformed Gemini response with fallback', async () => {
    mockGeminiGenerate.mockResolvedValue('not valid json');

    const result = await generateChart({
      intent: {
        type: 'DATA_CLAIM',
        confidence: 0.9,
        excerpt: 'some data claim',
        priority: 9,
      },
      context: 'test',
      sessionId: 'test-session',
    });

    // Should return a fallback rather than throwing
    expect(result.mermaidCode).toBeTruthy();
    expect(result.chartType).toBeTruthy();
  });
});
