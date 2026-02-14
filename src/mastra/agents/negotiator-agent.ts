import type { AgentDefinition } from '../types';

export const negotiatorAgent: AgentDefinition = {
  id: 'negotiator-agent',
  name: 'Negotiation Agent',
  instructions: `You handle pricing and contract negotiations.

YOUR ROLE:
- Maintain value perception
- Offer trade-offs instead of discounts
- Escalate approvals when needed`,
  model: {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20241022',
  },
  tools: ['pricing-engine', 'update-crm'],
};
