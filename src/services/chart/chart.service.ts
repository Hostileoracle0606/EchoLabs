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

    const parsed = JSON.parse(response);

    // 1. First attempt validation
    if (parsed.mermaid && validateMermaid(parsed.mermaid)) {
      return {
        mermaidCode: parsed.mermaid,
        chartType: (detectDiagramType(parsed.mermaid) || parsed.diagramType || 'graph') as MermaidChartType,
        title: parsed.title || 'Chart',
        narration: parsed.narration || '',
      };
    }

    // 2. If invalid, attempt repair
    if (parsed.mermaid) {
      console.warn('[Chart Service] Invalid Mermaid detected. Attempting repair...', parsed.mermaid);
      const repairedCode = await repairMermaidSyntax(parsed.mermaid);

      if (validateMermaid(repairedCode)) {
        console.log('[Chart Service] Repair successful!');
        return {
          mermaidCode: repairedCode,
          chartType: (detectDiagramType(repairedCode) || parsed.diagramType || 'graph') as MermaidChartType,
          title: parsed.title || 'Chart',
          narration: parsed.narration || '',
        };
      }
      console.warn('[Chart Service] Repair failed. Falling back.');
    }

    return createFallbackChart(intent.excerpt);
  } catch (error) {
    console.error('[Chart Service] Error:', error);
    return createFallbackChart(intent.excerpt);
  }
}

async function repairMermaidSyntax(faultyCode: string): Promise<string> {
  try {
    const response = await geminiGenerate({
      systemPrompt: require('./prompts').CHART_REPAIR_PROMPT,
      userPrompt: `Faulty Code:\n${faultyCode}`,
      jsonMode: true,
    });

    const parsed = JSON.parse(response);
    return parsed.mermaid || faultyCode;
  } catch (error) {
    console.error('[Chart Service] Repair failed:', error);
    return faultyCode;
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
