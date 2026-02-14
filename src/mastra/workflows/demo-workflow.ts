import type { WorkflowDefinition } from '../types';

export const demoWorkflow: WorkflowDefinition = {
  id: 'demo-workflow',
  name: 'Demo Workflow',
  description: 'Deliver a focused demo aligned to customer pains and success criteria.',
  steps: [
    'Confirm demo goals',
    'Show core workflow',
    'Highlight differentiators',
    'Validate fit with questions',
  ],
};
