import { geminiGenerate } from '../gemini/gemini.client';
import { CHART_GENERATION_PROMPT } from './prompts';
import { ChartGenerationResponseSchema } from './chart-schema';
import type { AgentRequest, ChartAgentResponse } from '@/types/agents';

export async function generateChart(request: AgentRequest): Promise<ChartAgentResponse> {
  const { intent, context } = request;

  try {
    console.log('[Chart Service] Generating with prompt:', `Data claim: "${intent.excerpt}"`);
    const response = await geminiGenerate({
      systemPrompt: CHART_GENERATION_PROMPT,
      userPrompt: `Data claim: "${intent.excerpt}"\nContext: ${context}`,
      jsonMode: true,
      apiKey: request.providerApiKey,
    });

    console.log('[Chart Service] Gemini Response:', response);

    const parsed = ChartGenerationResponseSchema.safeParse(JSON.parse(response));
    if (!parsed.success) {
      return createFallbackChart(intent.excerpt);
    }

    return {
      chartSpec: parsed.data.chart,
      narration: parsed.data.narration || '',
    };
  } catch (error) {
    console.error('[Chart Service] Error:', error);
    return createFallbackChart(intent.excerpt);
  }
}

function createFallbackChart(excerpt: string): ChartAgentResponse {
  return {
    chartSpec: {
      kind: 'metric',
      title: 'Captured Claim',
      value: 'Needs source data',
      detail: excerpt.slice(0, 120),
      trend: 'flat',
    },
    narration: excerpt,
  };
}
