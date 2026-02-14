import type { CallSummary, NextStep } from '@/types/sales';

export interface ClientzonePayload {
  callId: string;
  sessionId: string;
  summary: CallSummary;
  nextSteps: NextStep[];
  actionItems: string[];
}

export class ClientzoneAdapter {
  async sendSummary(payload: ClientzonePayload): Promise<{ success: boolean }> {
    // TODO: Implement Clientzone API integration (auth + payload schema).
    void payload;
    return { success: true };
  }

  async sendActionItems(callId: string, items: string[]): Promise<{ success: boolean }> {
    // TODO: Implement Clientzone action items endpoint.
    void callId;
    void items;
    return { success: true };
  }

  async sendFollowUps(callId: string, followUps: NextStep[]): Promise<{ success: boolean }> {
    // TODO: Implement Clientzone follow-up delivery.
    void callId;
    void followUps;
    return { success: true };
  }
}

const globalForClientzone = global as unknown as { clientzoneAdapter?: ClientzoneAdapter };

export function getClientzoneAdapter(): ClientzoneAdapter {
  if (!globalForClientzone.clientzoneAdapter) {
    globalForClientzone.clientzoneAdapter = new ClientzoneAdapter();
  }
  return globalForClientzone.clientzoneAdapter;
}
