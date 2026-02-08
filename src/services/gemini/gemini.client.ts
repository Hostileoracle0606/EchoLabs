import { GoogleGenAI } from '@google/genai';

let genaiInstance: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!genaiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genaiInstance = new GoogleGenAI({ apiKey });
  }
  return genaiInstance;
}

export interface GeminiGenerateOptions {
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
}

/**
 * Generate mock responses for different prompt types.
 * Analyzes the content to return appropriate mock data.
 */
function generateMockResponse(options: GeminiGenerateOptions): string {
  const { systemPrompt, userPrompt } = options;
  const lowerPrompt = userPrompt.toLowerCase();
  const lowerSystem = systemPrompt.toLowerCase();

  // Intent classification mock
  if (lowerSystem.includes('intent classifier')) {
    const intents: Array<{ type: string; confidence: number; excerpt: string }> = [];

    // Detect DATA_CLAIM patterns
    if (/\d+%|\$[\d,]+|million|billion|\d+ (customers|users|percent)/i.test(userPrompt)) {
      const match = userPrompt.match(/(?:grew|increased|reached|have|at)\s.*?(?:\d+%|\$[\d,]+|\d+ million)/i);
      intents.push({
        type: 'DATA_CLAIM',
        confidence: 0.92,
        excerpt: match?.[0] || 'numeric data claim detected',
      });
    }

    // Detect REFERENCE patterns
    if (/according to|study|report|research|mckinsey|gartner|harvard/i.test(userPrompt)) {
      intents.push({
        type: 'REFERENCE',
        confidence: 0.88,
        excerpt: 'external reference mentioned',
      });
    }

    // Detect KEY_POINT patterns
    if (/critical|important|bottom line|key takeaway|main point/i.test(userPrompt)) {
      intents.push({
        type: 'KEY_POINT',
        confidence: 0.85,
        excerpt: 'key point emphasized',
      });
    }

    // Detect ACTION_ITEM patterns
    if (/need to|should|must|by friday|deadline|follow up/i.test(userPrompt)) {
      intents.push({
        type: 'ACTION_ITEM',
        confidence: 0.87,
        excerpt: 'action item identified',
      });
    }

    // Detect DECISION patterns
    if (/decided|agreed|choosing|will go with|option/i.test(userPrompt)) {
      intents.push({
        type: 'DECISION',
        confidence: 0.85,
        excerpt: 'decision stated',
      });
    }

    return JSON.stringify({ intents });
  }

  // Chart generation mock
  if (lowerSystem.includes('chart') || lowerSystem.includes('mermaid')) {
    return JSON.stringify({
      mermaid: 'pie title "Mock Data Visualization"\n  "Category A" : 45\n  "Category B" : 35\n  "Category C" : 20',
      narration: 'This pie chart shows the distribution across three main categories',
      diagramType: 'pie',
    });
  }

  // Reference search mock
  if (lowerSystem.includes('reference') || lowerSystem.includes('source')) {
    return JSON.stringify({
      title: 'Mock Research Report - Industry Analysis 2024',
      url: 'https://example.com/mock-research-report',
      snippet: 'This mock reference provides context for the mentioned data point.',
      confidence: 'plausible',
      domain: 'example.com',
    });
  }

  // Summary mock
  if (lowerSystem.includes('summary') || lowerSystem.includes('bullet')) {
    return JSON.stringify([
      { category: 'key_point', text: 'Mock key point from transcript' },
      { category: 'action_item', text: 'Mock action item identified', owner: 'Team' },
    ]);
  }

  // Default mock response
  return JSON.stringify({ message: 'Mock response', success: true });
}

export async function geminiGenerate(options: GeminiGenerateOptions): Promise<string> {
  // Check for mock mode
  if (process.env.MOCK_MODE === 'true') {
    console.log('[Gemini] MOCK_MODE enabled, returning mock response');
    return generateMockResponse(options);
  }

  const {
    model = 'gemini-2.0-flash',
    systemPrompt,
    userPrompt,
    jsonMode = false,
  } = options;

  const genai = getGenAI();

  const response = await genai.models.generateContent({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }
  return text;
}

export function resetGeminiClient(): void {
  genaiInstance = null;
}
