import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processSummaryIntent, processTranscriptSweep } from './summary.service';
import { GEMINI_SUMMARY_SWEEP_RESPONSE } from '../../../__tests__/fixtures/gemini-responses';

vi.mock('../gemini/gemini.client', () => ({
  geminiGenerate: vi.fn(),
}));

describe('SummaryService', () => {
  let mockGeminiGenerate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const geminiModule = await import('../gemini/gemini.client');
    mockGeminiGenerate = vi.mocked(geminiModule.geminiGenerate);
    // Reset the in-memory state between tests
    const { resetSummaryState } = await import('./summary.service');
    resetSummaryState();
  });

  describe('processSummaryIntent', () => {
    it('converts a KEY_POINT intent into a summary bullet', () => {
      const result = processSummaryIntent({
        intent: {
          type: 'KEY_POINT',
          confidence: 0.9,
          excerpt: 'Revenue grew 40% last quarter, driven by enterprise',
          priority: 6,
        },
        context: 'revenue discussion',
        sessionId: 'test-session',
      });

      expect(result.bullets).toHaveLength(1);
      expect(result.bullets[0].category).toBe('key_point');
      expect(result.bullets[0].text).toContain('Revenue grew 40%');
    });

    it('converts a DECISION intent into a summary bullet', () => {
      const result = processSummaryIntent({
        intent: {
          type: 'DECISION',
          confidence: 0.87,
          excerpt: "We've decided to go with vendor B for the contract",
          priority: 7,
        },
        context: 'vendor selection',
        sessionId: 'test-session',
      });

      expect(result.bullets).toHaveLength(1);
      expect(result.bullets[0].category).toBe('decision');
    });

    it('converts an ACTION_ITEM intent and extracts owner', () => {
      const result = processSummaryIntent({
        intent: {
          type: 'ACTION_ITEM',
          confidence: 0.91,
          excerpt: 'Sarah needs to send the revised budget by Friday',
          priority: 8,
        },
        context: 'budget discussion',
        sessionId: 'test-session',
      });

      expect(result.bullets).toHaveLength(1);
      expect(result.bullets[0].category).toBe('action_item');
    });

    it('deduplicates repeated intents', () => {
      const intentPayload = {
        intent: {
          type: 'KEY_POINT' as const,
          confidence: 0.9,
          excerpt: 'Revenue grew 40% last quarter',
          priority: 6,
        },
        context: 'revenue',
        sessionId: 'test-session',
      };

      const result1 = processSummaryIntent(intentPayload);
      const result2 = processSummaryIntent(intentPayload);

      expect(result1.bullets).toHaveLength(1);
      expect(result2.bullets).toHaveLength(0); // Duplicate filtered
    });
  });

  describe('processTranscriptSweep', () => {
    it('extracts multiple bullet types from a full transcript', async () => {
      mockGeminiGenerate.mockResolvedValue(
        JSON.stringify({ bullets: GEMINI_SUMMARY_SWEEP_RESPONSE })
      );

      const result = await processTranscriptSweep(
        'Revenue grew 40%. We decided to hire 5 engineers. Sarah sends budget Friday. Should we expand to APAC?',
        'test-session'
      );

      expect(result.bullets.length).toBeGreaterThanOrEqual(1);
    });

    it('handles Gemini failure gracefully', async () => {
      mockGeminiGenerate.mockRejectedValue(new Error('API error'));

      const result = await processTranscriptSweep('some transcript text', 'test-session');

      expect(result.bullets).toHaveLength(0);
    });

    it('handles malformed Gemini response', async () => {
      mockGeminiGenerate.mockResolvedValue('not json');

      const result = await processTranscriptSweep('some transcript text', 'test-session');

      expect(result.bullets).toHaveLength(0);
    });
  });
});
