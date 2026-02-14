import type { WorkflowDefinition } from '../types';

export const objectionWorkflow: WorkflowDefinition = {
  id: 'objection-workflow',
  name: 'Objection Handling Workflow',
  description: 'Structured response to objections with validation and resolution.',
  steps: [
    'Acknowledge concern',
    'Clarify root cause',
    'Isolate objection',
    'Address with evidence',
    'Confirm resolution',
  ],
};
