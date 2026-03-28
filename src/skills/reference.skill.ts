import { Type } from '@google/genai';
import type { SkillDefinition, AgentContext } from './types';
import { findReferences } from '@/services/reference/reference.service';
import type { ClassifiedIntent } from '@/types/intents';

export const referenceSkill: SkillDefinition = {
  name: 'find_references',

  description:
    'Find authoritative sources for claims that reference studies, reports, articles, or external data. ' +
    'Invoke when phrases like "according to", citations, named sources, or external statistics appear.',

  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The claim or reference to search for authoritative sources.',
      },
      source_hint: {
        type: Type.STRING,
        description:
          'The named source if explicitly mentioned (e.g., "McKinsey", "Harvard Business Review", "Gartner").',
      },
    },
    required: ['query'],
  },

  broadcastEvent: 'agent:reference',

  async execute(args: Record<string, unknown>, ctx: AgentContext) {
    const query = args.query as string;

    const intent: ClassifiedIntent = {
      type: 'REFERENCE',
      confidence: 1.0,
      excerpt: query,
      priority: 7,
    };

    const result = await findReferences({
      intent,
      context: ctx.fullContext,
      sessionId: ctx.sessionId,
    });

    // Deposit hints for sibling skills
    if (result.sources.length > 0) {
      ctx.hints.reference_found = true;
      ctx.hints.reference_titles = result.sources.map((s) => s.title);
    }

    return result;
  },

  async mockExecute(args: Record<string, unknown>) {
    const query = (args.query as string) || '';
    return {
      sources: [
        {
          title: `Mock Source: ${query.slice(0, 40)}`,
          url: 'https://example.com/mock-reference',
          snippet: 'Mock reference snippet for the mentioned claim.',
          confidence: 'partial',
          domain: 'example.com',
        },
      ],
      query,
    };
  },
};
