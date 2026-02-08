import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processTranscript } from './orchestrator.service';
import {
  GEMINI_DATA_CLAIM_RESPONSE,
  GEMINI_MULTI_INTENT_RESPONSE,
  GEMINI_NO_INTENT_RESPONSE,
} from '../../../__tests__/fixtures/gemini-responses';

vi.mock('../gemini/gemini.client', () => ({
  geminiGenerate: vi.fn(),
}));

// Mock global fetch for agent dispatch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('OrchestratorService', () => {
  let mockGeminiGenerate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    const geminiModule = await import('../gemini/gemini.client');
    mockGeminiGenerate = vi.mocked(geminiModule.geminiGenerate);
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

  it('dispatches DATA_CLAIM to chart agent', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_DATA_CLAIM_RESPONSE));

    const result = await processTranscript({
      text: 'Revenue grew 40% last quarter',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.dispatched).toContain('/api/agents/chart');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/agents/chart'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('dispatches multiple agents in parallel for multi-intent', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_MULTI_INTENT_RESPONSE));

    const result = await processTranscript({
      text: 'Revenue grew 40%, which McKinsey noted. Sarah emailed me.',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.dispatched).toContain('/api/agents/chart');
    expect(result.dispatched).toContain('/api/agents/reference');
    expect(result.dispatched).toContain('/api/agents/context');
    expect(mockFetch).toHaveBeenCalledTimes(3);
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
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does not dispatch for TOPIC_SHIFT (no agent mapping)', async () => {
    mockGeminiGenerate.mockResolvedValue(
      JSON.stringify({
        intents: [{ type: 'TOPIC_SHIFT', confidence: 0.8, excerpt: 'Moving on' }],
      })
    );

    const result = await processTranscript({
      text: 'Moving on to the next topic',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.intents).toHaveLength(1);
    expect(result.dispatched).toHaveLength(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('continues dispatching even if one agent fails', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_MULTI_INTENT_RESPONSE));
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 }) // chart fails
      .mockResolvedValueOnce({ ok: true }) // reference succeeds
      .mockResolvedValueOnce({ ok: true }); // context succeeds

    const result = await processTranscript({
      text: 'Revenue grew 40%, McKinsey report, Sarah email',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    // All three should still be in dispatched (we attempted them all)
    expect(result.dispatched).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('passes sessionId and context in agent request body', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_DATA_CLAIM_RESPONSE));

    await processTranscript({
      text: 'Revenue grew 40%',
      timestamp: Date.now(),
      sessionId: 'my-session-123',
      context: 'previous discussion context',
    });

    const fetchCall = mockFetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.sessionId).toBe('my-session-123');
    expect(body.context).toBe('previous discussion context');
  });
});
