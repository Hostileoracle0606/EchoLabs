import { Type } from '@google/genai';
import type { SkillDefinition, AgentContext } from './types';
import { findContextMatches } from '@/services/context/context.service';
import type { ClassifiedIntent } from '@/types/intents';

export const contextSkill: SkillDefinition = {
  name: 'search_context',

  description:
    'Search organizational context — emails, documents, calendar events, and Slack messages — ' +
    'for matches related to the transcript. Invoke when people, emails, documents, meetings, or calendar events are mentioned.',

  parameters: {
    type: Type.OBJECT,
    properties: {
      search_text: {
        type: Type.STRING,
        description:
          'The text or entity to search for in organizational context (person name, project, document title, etc.).',
      },
      match_types: {
        type: Type.ARRAY,
        description:
          'Optional filter for which types to search: email, doc, calendar, slack. Omit to search all.',
        items: { type: Type.STRING },
      },
    },
    required: ['search_text'],
  },

  broadcastEvent: 'agent:context',

  async execute(args: Record<string, unknown>, ctx: AgentContext) {
    const searchText = args.search_text as string;

    const intent: ClassifiedIntent = {
      type: 'EMAIL_MENTION',
      confidence: 1.0,
      excerpt: searchText,
      priority: 6,
    };

    const result = await findContextMatches({
      intent,
      context: ctx.fullContext,
      sessionId: ctx.sessionId,
    });

    // Deposit hints for sibling skills
    if (result.matches.length > 0) {
      ctx.hints.context_matchCount = result.matches.length;
      ctx.hints.context_types = [...new Set(result.matches.map((m) => m.matchType))];
    }

    // Return ContextPayload shape: top-level matchType comes from the dominant
    // match type (highest count), so the broadcast has a well-formed payload.
    const typeCounts = result.matches.reduce<Record<string, number>>((acc, m) => {
      acc[m.matchType] = (acc[m.matchType] ?? 0) + 1;
      return acc;
    }, {});
    const dominantType = (Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'email') as 'email' | 'doc' | 'calendar' | 'slack';

    return { matchType: dominantType, matches: result.matches };
  },

  async mockExecute(args: Record<string, unknown>) {
    const searchText = (args.search_text as string) || '';
    return {
      matchType: 'email' as const,
      matches: [
        {
          id: `mock-ctx-${Date.now()}`,
          matchType: 'email' as const,
          title: `Mock match: ${searchText.slice(0, 40)}`,
          preview: 'Mock context preview for the mentioned entity.',
          relevanceScore: 0.8,
        },
      ],
    };
  },
};
