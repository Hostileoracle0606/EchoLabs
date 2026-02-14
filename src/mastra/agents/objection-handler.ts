import type { AgentDefinition } from '../types';

export const objectionHandlerAgent: AgentDefinition = {
  id: 'objection-handler',
  name: 'Objection Handling Specialist',
  instructions: `You are an expert at handling customer objections.

YOUR ROLE:
- Acknowledge and validate concerns
- Clarify root issue
- Provide targeted response
- Confirm resolution and move forward

FRAMEWORK:
1. Acknowledge
2. Clarify
3. Isolate
4. Address
5. Confirm`,
  model: {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20241022',
  },
  tools: ['detect-objection', 'search-knowledge-base', 'pricing-engine'],
};
