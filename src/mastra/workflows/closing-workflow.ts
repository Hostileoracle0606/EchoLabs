import type { WorkflowDefinition } from '../types';

export const closingWorkflow: WorkflowDefinition = {
  id: 'closing-workflow',
  name: 'Closing Workflow',
  description: 'Confirm value and secure a concrete next step.',
  steps: [
    'Summarize value',
    'Confirm readiness',
    'Propose next step',
    'Schedule follow-up',
  ],
};
