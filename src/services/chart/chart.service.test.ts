import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateChart } from './chart.service';

vi.mock('../gemini/gemini.client', () => ({
  geminiGenerate: vi.fn(),
}));

const PIE_CHART_RESPONSE = {
  chart: {
    kind: 'pie',
    title: 'Revenue Breakdown',
    data: [
      { label: 'Enterprise', value: 40 },
      { label: 'SMB', value: 35 },
      { label: 'Consumer', value: 25 },
    ],
  },
  narration: 'Revenue is split across three segments, with enterprise leading at 40 percent',
};

const BAR_CHART_RESPONSE = {
  chart: {
    kind: 'bar',
    title: 'Hiring by Quarter',
    xLabel: 'Quarter',
    yLabel: 'Hires',
    data: [
      { label: 'Q1', value: 5 },
      { label: 'Q2', value: 8 },
      { label: 'Q3', value: 12 },
    ],
  },
  narration: 'Hiring has accelerated each quarter, reaching 12 in Q3',
};

const METRIC_CHART_RESPONSE = {
  chart: {
    kind: 'metric',
    title: 'AI Strategy Scope',
    value: '2 pillars',
    detail: 'Hiring and infrastructure are both in focus.',
    trend: 'flat',
  },
  narration: 'The AI strategy encompasses hiring and infrastructure investments',
};

describe('ChartService', () => {
  let mockGeminiGenerate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const geminiModule = await import('../gemini/gemini.client');
    mockGeminiGenerate = vi.mocked(geminiModule.geminiGenerate);
  });

  it('generates a pie chart from a revenue data claim', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(PIE_CHART_RESPONSE));

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

    expect(result.chartSpec.kind).toBe('pie');
    expect(result.chartSpec.title).toBe('Revenue Breakdown');
    expect(result.narration).toBeTruthy();
  });

  it('generates a bar chart from hiring data', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(BAR_CHART_RESPONSE));

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

    expect(result.chartSpec.kind).toBe('bar');
    expect(result.chartSpec.title).toBe('Hiring by Quarter');
  });

  it('generates a metric chart when there is only one headline figure', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(METRIC_CHART_RESPONSE));

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

    expect(result.chartSpec.kind).toBe('metric');
    expect(result.chartSpec.title).toBe('AI Strategy Scope');
  });

  it('includes title in the response', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(PIE_CHART_RESPONSE));

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

    expect(result.chartSpec.title).toBeTruthy();
  });

  it('calls Gemini with JSON mode for structured output', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(PIE_CHART_RESPONSE));

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

    expect(result.chartSpec.kind).toBe('metric');
    expect(result.chartSpec.title).toBeTruthy();
  });
});
