import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processTranscript } from './orchestrator.service';
import {
  GEMINI_DATA_CLAIM_RESPONSE,
  GEMINI_MULTI_INTENT_RESPONSE,
  GEMINI_NO_INTENT_RESPONSE,
} from '../../../__tests__/fixtures/gemini-responses';

// Mock dependencies
vi.mock('../gemini/gemini.client', () => ({
  geminiGenerate: vi.fn(),
}));

vi.mock('../chart/chart.service', () => ({
  generateChart: vi.fn(),
}));

vi.mock('../summary/summary.service', () => ({
  processSummaryIntent: vi.fn(),
}));

vi.mock('../reference/reference.service', () => ({
  findReferences: vi.fn(),
}));

vi.mock('../context/context.service', () => ({
  findContextMatches: vi.fn(),
}));

vi.mock('@/websocket/ws-server', () => ({
  broadcast: vi.fn(),
}));

describe('OrchestratorService', () => {
  let mockGeminiGenerate: ReturnType<typeof vi.fn>;
  let mockGenerateChart: ReturnType<typeof vi.fn>;
  let mockProcessSummaryIntent: ReturnType<typeof vi.fn>;
  let mockFindReferences: ReturnType<typeof vi.fn>;
  let mockFindContextMatches: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import mocks
    const geminiModule = await import('../gemini/gemini.client');
    mockGeminiGenerate = vi.mocked(geminiModule.geminiGenerate);

    const chartModule = await import('../chart/chart.service');
    mockGenerateChart = vi.mocked(chartModule.generateChart);
    mockGenerateChart.mockResolvedValue({});

    const summaryModule = await import('../summary/summary.service');
    mockProcessSummaryIntent = vi.mocked(summaryModule.processSummaryIntent);
    mockProcessSummaryIntent.mockResolvedValue({});

    const referenceModule = await import('../reference/reference.service');
    mockFindReferences = vi.mocked(referenceModule.findReferences);
    mockFindReferences.mockResolvedValue({});

    const contextModule = await import('../context/context.service');
    mockFindContextMatches = vi.mocked(contextModule.findContextMatches);
    mockFindContextMatches.mockResolvedValue({ matches: [] }); // Default no matches
  });

  it('classifies intents and returns them with priorities', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_DATA_CLAIM_RESPONSE));

    const result = await processTranscript({
      text: 'Revenue grew 40% last quarter',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.intents).toHaveLength(1);
    expect(result.intents[0].type).toBe('DATA_CLAIM');
    expect(result.intents[0].priority).toBe(9);
  });

  it('dispatches DATA_CLAIM to chart service', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_DATA_CLAIM_RESPONSE));

    const result = await processTranscript({
      text: 'Revenue grew 40% last quarter',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.dispatched).toContain('DATA_CLAIM');
    expect(mockGenerateChart).toHaveBeenCalledWith(expect.objectContaining({
      intent: expect.objectContaining({ type: 'DATA_CLAIM' }),
      sessionId: 'test-session',
    }));
  });

  it('dispatches multiple agents in parallel for multi-intent', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_MULTI_INTENT_RESPONSE));

    const result = await processTranscript({
      text: 'Revenue grew 40%, which McKinsey noted. Sarah emailed me.',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    // Expect appropriate services to be called
    expect(mockGenerateChart).toHaveBeenCalled();
    expect(mockFindReferences).toHaveBeenCalled();
    // Context is called generally now if intents exist
    expect(mockFindContextMatches).toHaveBeenCalled();

    expect(result.dispatched.length).toBeGreaterThanOrEqual(2);
  });

  it('does not dispatch when no intents classified', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_NO_INTENT_RESPONSE));

    const result = await processTranscript({
      text: 'Um, yeah, let me think',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.intents).toHaveLength(0);
    expect(result.dispatched).toHaveLength(0);
    expect(mockGenerateChart).not.toHaveBeenCalled();
  });

  it('passes sessionId and context in agent request arguments', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_DATA_CLAIM_RESPONSE));

    await processTranscript({
      text: 'Revenue grew 40%',
      timestamp: Date.now(),
      sessionId: 'my-session-123',
      context: 'previous discussion context',
    });

    expect(mockGenerateChart).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: 'my-session-123',
      context: 'previous discussion context'
    }));
  });
});
