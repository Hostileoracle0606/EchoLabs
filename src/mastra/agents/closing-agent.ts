import type { AgentDefinition } from '../types';

export const closingAgent: AgentDefinition = {
  id: 'closing-agent',
  name: 'Closing Agent',
  instructions: `You guide the conversation toward a clear next step.

YOUR ROLE:
- Confirm alignment on value
- Propose specific next step
- Handle final clarifications
- Secure commitment`,
  model: {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20241022',
  },
  tools: ['schedule-meeting', 'update-crm'],
};
