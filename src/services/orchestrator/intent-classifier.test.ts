import { describe, it, expect, vi, beforeEach } from 'vitest';
import { classifyIntents } from './intent-classifier';
import {
  GEMINI_DATA_CLAIM_RESPONSE,
  GEMINI_MULTI_INTENT_RESPONSE,
  GEMINI_NO_INTENT_RESPONSE,
  GEMINI_TOPIC_SHIFT_RESPONSE,
} from '../../../__tests__/fixtures/gemini-responses';

vi.mock('../gemini/gemini.client', () => ({
  geminiGenerate: vi.fn(),
}));

describe('IntentClassifier', () => {
  let mockGeminiGenerate: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const geminiModule = await import('../gemini/gemini.client');
    mockGeminiGenerate = vi.mocked(geminiModule.geminiGenerate);
  });

  it('classifies a single DATA_CLAIM intent', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_DATA_CLAIM_RESPONSE));

    const result = await classifyIntents('Our revenue grew 40% last quarter');

    expect(result.intents).toHaveLength(1);
    expect(result.intents[0].type).toBe('DATA_CLAIM');
    expect(result.intents[0].confidence).toBeGreaterThanOrEqual(0.5);
    expect(result.intents[0].excerpt).toBeTruthy();
  });

  it('classifies multiple intents from a complex sentence', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_MULTI_INTENT_RESPONSE));

    const result = await classifyIntents(
      'Our revenue grew 40%, which McKinsey also noted in their recent AI report. Sarah emailed me the details last week.'
    );

    expect(result.intents).toHaveLength(3);
    const types = result.intents.map((i) => i.type);
    expect(types).toContain('DATA_CLAIM');
    expect(types).toContain('REFERENCE');
    expect(types).toContain('EMAIL_MENTION');
  });

  it('returns empty intents array for filler text', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_NO_INTENT_RESPONSE));

    const result = await classifyIntents('Um, so, yeah, let me think about that for a second.');

    expect(result.intents).toHaveLength(0);
  });

  it('filters out intents with confidence below 0.5', async () => {
    mockGeminiGenerate.mockResolvedValue(
      JSON.stringify({
        intents: [
          { type: 'DATA_CLAIM', confidence: 0.3, excerpt: 'maybe some numbers' },
          { type: 'KEY_POINT', confidence: 0.8, excerpt: 'important thing' },
        ],
      })
    );

    const result = await classifyIntents('maybe some numbers, but the important thing is...');

    expect(result.intents).toHaveLength(1);
    expect(result.intents[0].type).toBe('KEY_POINT');
  });

  it('includes rawText and processingTimeMs in result', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_TOPIC_SHIFT_RESPONSE));

    const inputText = 'Moving on to our hiring strategy';
    const result = await classifyIntents(inputText);

    expect(result.rawText).toBe(inputText);
    expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('calls geminiGenerate with JSON mode enabled', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify(GEMINI_DATA_CLAIM_RESPONSE));

    await classifyIntents('Revenue grew 40%');

    expect(mockGeminiGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonMode: true,
        userPrompt: expect.stringContaining('Revenue grew 40%'),
      })
    );
  });

  it('handles malformed Gemini response gracefully', async () => {
    mockGeminiGenerate.mockResolvedValue('not valid json at all');

    const result = await classifyIntents('some text');

    expect(result.intents).toHaveLength(0);
  });

  it('handles Gemini response missing intents field', async () => {
    mockGeminiGenerate.mockResolvedValue(JSON.stringify({ something: 'else' }));

    const result = await classifyIntents('some text');

    expect(result.intents).toHaveLength(0);
  });
});
