import { geminiGenerate } from '../gemini/gemini.client';
import { CHART_GENERATION_PROMPT } from './prompts';
import { validateMermaid, detectDiagramType } from './mermaid-validator';
import type { AgentRequest, ChartAgentResponse, MermaidChartType } from '@/types/agents';

export async function generateChart(request: AgentRequest): Promise<ChartAgentResponse> {
  const { intent, context } = request;

  try {
    const response = await geminiGenerate({
      systemPrompt: CHART_GENERATION_PROMPT,
      userPrompt: `Data claim: "${intent.excerpt}"\nContext: ${context}`,
      jsonMode: true,
    });

    const parsed = JSON.parse(response);

    if (parsed.mermaid && validateMermaid(parsed.mermaid)) {
      return {
        mermaidCode: parsed.mermaid,
        chartType: (detectDiagramType(parsed.mermaid) || parsed.diagramType || 'graph') as MermaidChartType,
        title: parsed.title || 'Chart',
        narration: parsed.narration || '',
      };
    }

    // If mermaid field exists but didn't validate, still try to use it
    if (parsed.mermaid) {
      return {
        mermaidCode: parsed.mermaid,
        chartType: (parsed.diagramType || 'graph') as MermaidChartType,
        title: parsed.title || 'Chart',
        narration: parsed.narration || '',
      };
    }

    return createFallbackChart(intent.excerpt);
  } catch {
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
