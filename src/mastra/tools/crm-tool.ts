import type { ToolDefinition } from '../types';

export interface CRMOpportunityUpdate {
  opportunityId: string;
  updates: {
    stage?: string;
    probability?: number;
    painPoints?: string[];
    buyingSignals?: string[];
    objections?: string[];
    nextSteps?: string[];
    notes?: string;
  };
}

export interface CRMClientContext {
  accountId: string;
  accountName: string;
  industry?: string;
  currentStage?: string;
  knownPainPoints?: string[];
  lastContactedAt?: string;
}

export const updateCrmTool: ToolDefinition<CRMOpportunityUpdate, { success: boolean }> = {
  id: 'update-crm',
  description: 'Update CRM opportunity with conversation insights',
  execute: async (input) => {
    // TODO: Integrate Salesforce (or chosen CRM) API update.
    // Expected: update opportunity stage, notes, next steps, and log activity.
    void input;
    return { success: true };
  },
};

export const fetchCrmContextTool: ToolDefinition<{ accountId: string }, CRMClientContext | null> = {
  id: 'fetch-crm-context',
  description: 'Fetch client context from CRM',
  execute: async (input) => {
    // TODO: Integrate CRM API lookup by account or opportunity ID.
    void input;
    return null;
  },
};
