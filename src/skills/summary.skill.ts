import { Type } from '@google/genai';
import type { SkillDefinition, AgentContext } from './types';
import { processSummaryIntent } from '@/services/summary/summary.service';
import type { ClassifiedIntent } from '@/types/intents';
import type { SummaryBullet } from '@/types/agents';

const CATEGORY_TO_INTENT: Record<string, string> = {
  key_point: 'KEY_POINT',
  decision: 'DECISION',
  action_item: 'ACTION_ITEM',
  question: 'QUESTION',
};

export const summarySkill: SkillDefinition = {
  name: 'extract_summary',

  description:
    'Extract key points, decisions, action items, and open questions from the transcript text. ' +
    'Invoke when important statements, conclusions, task assignments, or questions are present.',

  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: 'The transcript text to extract summary bullets from.',
      },
      categories: {
        type: Type.ARRAY,
        description:
          'Which categories to extract. One or more of: key_point, decision, action_item, question.',
        items: { type: Type.STRING },
      },
    },
    required: ['text'],
  },

  broadcastEvent: 'agent:summary',

  async execute(args: Record<string, unknown>, ctx: AgentContext) {
    const text = args.text as string;
    const categories = (args.categories as string[]) || ['key_point'];

    const allBullets: SummaryBullet[] = [];

    for (const cat of categories) {
      const intentType = CATEGORY_TO_INTENT[cat] || 'KEY_POINT';
      const intent: ClassifiedIntent = {
        type: intentType as ClassifiedIntent['type'],
        confidence: 1.0,
        excerpt: text,
        priority: 7,
      };

      const result = await processSummaryIntent({
        intent,
        context: ctx.fullContext,
        sessionId: ctx.sessionId,
      });

      allBullets.push(...result.bullets);
    }

    // Deposit hints for sibling skills
    ctx.hints.summary_keyThemes = allBullets.map((b) => b.text);
    ctx.hints.summary_actionItems = allBullets
      .filter((b) => b.category === 'action_item')
      .map((b) => ({ text: b.text, owner: b.owner }));

    return { bullets: allBullets };
  },

  async mockExecute(args: Record<string, unknown>) {
    const text = (args.text as string) || '';
    return {
      bullets: [
        {
          id: `bullet-mock-${Date.now()}`,
          text: `Mock summary: ${text.slice(0, 50)}`,
          category: 'key_point',
          timestamp: Date.now(),
          isNew: true,
        },
      ],
    };
  },
};
