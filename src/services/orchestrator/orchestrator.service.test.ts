import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processTranscript } from './orchestrator.service';

vi.mock('../chart/chart.service', () => ({
  generateChart: vi.fn().mockResolvedValue({
    chartSpec: {
      kind: 'pie',
      title: 'Test Chart',
      data: [
        { label: 'A', value: 40 },
        { label: 'B', value: 60 },
      ],
    },
    narration: 'Test narration',
  }),
}));

vi.mock('../summary/summary.service', () => ({
  processSummaryIntent: vi.fn().mockResolvedValue({
    bullets: [{ id: 'b1', text: 'Test bullet', category: 'key_point', timestamp: Date.now() }],
  }),
  processTranscriptSweep: vi.fn().mockResolvedValue({
    bullets: [],
  }),
  getSessionBullets: vi.fn().mockReturnValue([
    { id: 'b1', text: 'Test bullet', category: 'key_point', timestamp: Date.now() },
  ]),
}));

vi.mock('../reference/reference.service', () => ({
  findReferences: vi.fn().mockResolvedValue({
    sources: [
      {
        sourceId: 'source-1',
        connectorId: 'connector-1',
        connectorType: 'demo',
        syncedAt: new Date().toISOString(),
        title: 'Test',
        url: 'https://example.com',
        snippet: 'Test',
        confidence: 'partial',
        domain: 'example.com',
      },
    ],
    query: 'test',
  }),
}));

vi.mock('../context/context.service', () => ({
  findContextMatches: vi.fn().mockResolvedValue({ matches: [] }),
}));

vi.mock('@/websocket/ws-server', () => ({
  broadcast: vi.fn(),
}));

describe('OrchestratorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches chart work for numeric claims', async () => {
    const result = await processTranscript({
      text: 'Revenue grew 40% last quarter',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.dispatched).toContain('generate_chart');

    const { generateChart } = await import('../chart/chart.service');
    expect(generateChart).toHaveBeenCalledWith(
      expect.objectContaining({
        intent: expect.objectContaining({ type: 'DATA_CLAIM' }),
        sessionId: 'test-session',
      })
    );
  });

  it('dispatches multiple tracks in parallel when text matches them', async () => {
    const result = await processTranscript({
      text: 'Revenue grew 40%, according to McKinsey, and Derek sent the board deck.',
      timestamp: Date.now(),
      sessionId: 'test-session',
      workspaceId: 'workspace-1',
    });

    expect(result.dispatched).toContain('generate_chart');
    expect(result.dispatched).toContain('find_references');
    expect(result.dispatched).toContain('search_context');
  });

  it('does not dispatch when text is not actionable', async () => {
    const result = await processTranscript({
      text: 'Um, yeah, let me think',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.dispatched).toHaveLength(0);
  });

  it('broadcasts agent status and chart results', async () => {
    const { broadcast } = await import('@/websocket/ws-server');

    await processTranscript({
      text: 'Revenue grew 40% last quarter',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(broadcast).toHaveBeenCalledWith(
      'agent:status',
      'test-session',
      expect.objectContaining({ agent: 'generate_chart', status: 'processing' })
    );
    expect(broadcast).toHaveBeenCalledWith(
      'agent:chart',
      'test-session',
      expect.objectContaining({ chartSpec: expect.any(Object) })
    );
  });

  it('passes context through to downstream services', async () => {
    await processTranscript({
      text: 'Revenue grew 40%',
      timestamp: Date.now(),
      sessionId: 'my-session-123',
      context: 'previous discussion context',
    });

    const { generateChart } = await import('../chart/chart.service');
    expect(generateChart).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: 'my-session-123',
        context: expect.stringContaining('previous discussion context'),
      })
    );
  });

  it('extracts summaries for decisions and action items', async () => {
    const result = await processTranscript({
      text: 'We decided to ship this and need to follow up by Friday.',
      timestamp: Date.now(),
      sessionId: 'summary-session',
      context: 'meeting transcript context',
    });

    expect(result.dispatched).toContain('extract_summary');

    const { processSummaryIntent } = await import('../summary/summary.service');
    expect(processSummaryIntent).toHaveBeenCalled();
  });
});
