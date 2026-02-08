import { geminiGenerate } from '../gemini/gemini.client';
import { INTENT_CLASSIFICATION_PROMPT } from './prompts';
import type { IntentType, ClassificationResult } from '@/types/intents';
import { INTENT_TYPES } from '@/types/intents';

interface RawIntent {
  type: string;
  confidence: number;
  excerpt: string;
}

function isValidIntentType(type: string): type is IntentType {
  return INTENT_TYPES.includes(type as IntentType);
}

export async function classifyIntents(text: string): Promise<ClassificationResult> {
  const startTime = Date.now();

  try {
    console.log('[IntentClassifier] Calling Gemini with text:', text.substring(0, 100));
    const response = await geminiGenerate({
      systemPrompt: INTENT_CLASSIFICATION_PROMPT,
      userPrompt: `Classify intents in this transcript chunk:\n\n"${text}"`,
      jsonMode: true,
    });
    console.log('[IntentClassifier] Gemini raw response:', response);

    const parsed = JSON.parse(response);
    console.log('[IntentClassifier] Parsed response:', parsed);

    if (!parsed.intents || !Array.isArray(parsed.intents)) {
      console.log('[IntentClassifier] No intents array in response');
      return { intents: [], rawText: text, processingTimeMs: Date.now() - startTime };
    }

    const validIntents = (parsed.intents as RawIntent[])
      .filter(
        (intent) =>
          isValidIntentType(intent.type) &&
          typeof intent.confidence === 'number' &&
          intent.confidence >= 0.5 &&
          typeof intent.excerpt === 'string'
      )
      .map((intent) => ({
        type: intent.type as IntentType,
        confidence: intent.confidence,
        excerpt: intent.excerpt,
        priority: 0, // Will be set by priority scorer
      }));

    return {
      intents: validIntents,
      rawText: text,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    console.error('[IntentClassifier] Error:', error);
    return { intents: [], rawText: text, processingTimeMs: Date.now() - startTime };
  }
}
