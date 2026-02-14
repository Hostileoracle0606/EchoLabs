import { geminiGenerate } from '../gemini/gemini.client';
import { CHART_GENERATION_PROMPT } from './prompts';
import { validateMermaid, detectDiagramType } from './mermaid-validator';
import type { AgentRequest, ChartAgentResponse, MermaidChartType } from '@/types/agents';

export async function generateChart(request: AgentRequest): Promise<ChartAgentResponse> {
  const { intent, context } = request;

  try {
    console.log('[Chart Service] Generating with prompt:', `Data claim: "${intent.excerpt}"`);
    const response = await geminiGenerate({
      systemPrompt: CHART_GENERATION_PROMPT,
      userPrompt: `Data claim: "${intent.excerpt}"\nContext: ${context}`,
      jsonMode: true,
    });

    console.log('[Chart Service] Gemini Response:', response);

    let parsed;
    try {
      parsed = JSON.parse(response);
    } catch (e) {
      console.error('[Chart Service] JSON Parse Error:', e);
      return createFallbackChart(intent.excerpt);
    }

    if (parsed.mermaid) {
      return {
        mermaidCode: parsed.mermaid,
        chartType: (detectDiagramType(parsed.mermaid) || parsed.diagramType || 'graph') as MermaidChartType,
        title: parsed.title || 'Chart',
        narration: parsed.narration || '',
      };
    }

    return createFallbackChart(intent.excerpt);
  } catch (error) {
    console.error('[Chart Service] Error:', error);
    return createFallbackChart(intent.excerpt);
  }
}

function createFallbackChart(excerpt: string): ChartAgentResponse {
  return {
    mermaidCode: `mindmap\n  root((Data Point))\n    ${excerpt.slice(0, 50)}`,
    chartType: 'mindmap',
    title: 'Data Point',
    narration: excerpt,
  };
}
