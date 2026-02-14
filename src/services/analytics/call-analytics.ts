import type { SalesStage } from '@/types/sales';

export interface CallMetrics {
  sessionId: string;
  callId: string;
  durationMs: number;
  customerTalkTimeMs: number;
  agentTalkTimeMs: number;
  questionsAsked: number;
  objectionsRaised: number;
  buyingSignalsDetected: number;
  outcome: string;
  stage: SalesStage;
  createdAt: number;
}

export class CallAnalyticsService {
  private metrics: CallMetrics[] = [];

  async trackCall(metrics: CallMetrics) {
    // TODO: Persist metrics to PostgreSQL and push to analytics dashboard.
    this.metrics.push(metrics);
  }

  async getSessionMetrics(sessionId: string): Promise<CallMetrics | null> {
    return this.metrics.find((m) => m.sessionId === sessionId) ?? null;
  }

  async getSummary(timeframe: 'day' | 'week' | 'month') {
    // TODO: Replace with DB query.
    const now = Date.now();
    const windowMs =
      timeframe === 'day' ? 24 * 60 * 60 * 1000 :
      timeframe === 'week' ? 7 * 24 * 60 * 60 * 1000 :
      30 * 24 * 60 * 60 * 1000;
    const items = this.metrics.filter((m) => now - m.createdAt <= windowMs);

    if (items.length === 0) {
      return {
        totalCalls: 0,
        avgDurationMs: 0,
        conversionRate: 0,
        avgTalkRatio: 0,
      };
    }

    const totalDuration = items.reduce((acc, item) => acc + item.durationMs, 0);
    const totalTalkRatio = items.reduce((acc, item) => {
      const totalTalk = item.customerTalkTimeMs + item.agentTalkTimeMs;
      return acc + (totalTalk === 0 ? 0 : item.customerTalkTimeMs / totalTalk);
    }, 0);

    return {
      totalCalls: items.length,
      avgDurationMs: totalDuration / items.length,
      conversionRate: items.filter((item) => item.outcome === 'closed_won').length / items.length,
      avgTalkRatio: totalTalkRatio / items.length,
    };
  }
}

const globalForAnalytics = global as unknown as { analyticsService?: CallAnalyticsService };

export function getCallAnalytics(): CallAnalyticsService {
  if (!globalForAnalytics.analyticsService) {
    globalForAnalytics.analyticsService = new CallAnalyticsService();
  }
  return globalForAnalytics.analyticsService;
}
