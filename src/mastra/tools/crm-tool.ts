import type { ToolDefinition } from '../types';
import {
  findFirstMockCrmProfile,
  findMockCrmProfileByContactId,
  getLatestCapturedDate,
  getProfileEntriesByFieldPrefix,
  getProfileField,
} from '@/services/crm/mock-crm';

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
    const profile =
      (await findMockCrmProfileByContactId(input.accountId)) ||
      (await findFirstMockCrmProfile());

    if (!profile) {
      return null;
    }

    const businessName = getProfileField(profile, 'business_name');
    const firstName = getProfileField(profile, 'first_name');
    const lastName = getProfileField(profile, 'last_name');
    const fallbackName = [firstName, lastName].filter(Boolean).join(' ');

    const callOutcome = getProfileField(profile, 'call_outcome');
    const currentStage = getProfileField(profile, 'current_stage') || callOutcome;

    const insightEntries = getProfileEntriesByFieldPrefix(profile, 'call_key_insight');
    const behaviorInsights = getProfileEntriesByFieldPrefix(profile, 'behavior_interpretation');

    const knownPainPoints = dedupe([
      ...insightEntries.map((entry) => entry.fieldValue),
      ...behaviorInsights.map((entry) => entry.fieldValue),
    ]);

    return {
      accountId: profile.contactId,
      accountName: businessName || fallbackName || profile.contactId,
      industry: getProfileField(profile, 'industry'),
      currentStage: currentStage || undefined,
      knownPainPoints: knownPainPoints.length ? knownPainPoints : undefined,
      lastContactedAt: getLatestCapturedDate(profile.entries),
    };
  },
};

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) continue;
    seen.add(value);
    unique.push(value);
  }
  return unique;
}
