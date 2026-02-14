import type { WorkflowDefinition } from '../types';

export const discoveryWorkflow: WorkflowDefinition = {
  id: 'discovery-workflow',
  name: 'Discovery Workflow',
  description: 'Guide discovery questions to uncover needs, pain points, and buying process.',
  steps: [
    'Rapport and agenda',
    'Current process',
    'Pain points and impact',
    'Success criteria',
    'Stakeholders and timeline',
  ],
};
