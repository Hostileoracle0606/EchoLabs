import { Type } from '@google/genai';
import type { SkillDefinition, AgentContext } from './types';
import { generateChart } from '@/services/chart/chart.service';
import type { ClassifiedIntent } from '@/types/intents';

export const chartSkill: SkillDefinition = {
  name: 'generate_chart',

  description:
    'Generate a structured chart spec to visualize a data claim, statistic, or quantitative comparison from the transcript. ' +
    'Invoke when numeric data, percentages, dollar amounts, comparisons, or trends are mentioned.',

  parameters: {
    type: Type.OBJECT,
    properties: {
      claim: {
        type: Type.STRING,
        description:
          'The specific data claim or statistic to visualize, extracted verbatim from the transcript.',
      },
      chart_type_hint: {
        type: Type.STRING,
        description:
          'Optional suggested chart type: bar, pie, or metric.',
      },
    },
    required: ['claim'],
  },

  broadcastEvent: 'agent:chart',

  async execute(args: Record<string, unknown>, ctx: AgentContext) {
    const claim = args.claim as string;

    const intent: ClassifiedIntent = {
      type: 'DATA_CLAIM',
      confidence: 1.0,
      excerpt: claim,
      priority: 9,
    };

    // Opportunistically enrich context with sibling hints
    let enrichedContext = ctx.fullContext;
    const themes = ctx.hints.summary_keyThemes;
    if (Array.isArray(themes) && themes.length > 0) {
      enrichedContext += `\nKey themes identified by summary agent: ${themes.join(', ')}`;
    }

    const result = await generateChart({
      intent,
      context: enrichedContext,
      sessionId: ctx.sessionId,
      providerApiKey: ctx.geminiApiKey,
    });

    // Deposit hints for sibling skills
    ctx.hints.chart_generated = true;
    ctx.hints.chart_title = result.chartSpec.title;

    return result;
  },

  async mockExecute(args: Record<string, unknown>) {
    const claim = args.claim as string;
    return {
      chartSpec: {
        kind: 'pie',
        title: `Mock Chart: ${claim.slice(0, 40)}`,
        data: [
          { label: 'Value', value: 40 },
          { label: 'Remaining', value: 60 },
        ],
      },
      narration: `Visualization of: ${claim}`,
      sourceExcerpt: claim,
    };
  },
};
