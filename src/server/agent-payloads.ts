import type {
  AgentStatusPayload,
  ChartPayload,
  ContextPayload,
  ReferencePayload,
  SummaryPayload,
} from '@/types/events';
import type {
  ChartAgentResponse,
  ContextAgentResponse,
  ReferenceAgentResponse,
  SummaryBullet,
} from '@/types/agents';

export function createAgentStatus(agent: string, status: AgentStatusPayload['status'], message?: string): AgentStatusPayload {
  return { agent, status, message };
}

export function createChartPayload(result: ChartAgentResponse, sourceExcerpt: string): ChartPayload {
  return {
    chartSpec: result.chartSpec,
    sourceExcerpt,
    narration: result.narration,
    provenance: {
      sourceIds: [],
      connectorIds: [],
    },
  };
}

export function createReferencePayload(result: ReferenceAgentResponse): ReferencePayload {
  return {
    sources: result.sources,
    query: result.query,
    provenance: {
      sourceIds: result.sources.map((source) => source.sourceId),
      connectorIds: [...new Set(result.sources.map((source) => source.connectorId))],
      syncedAt: result.sources[0]?.syncedAt,
    },
  };
}

export function createContextPayloads(result: ContextAgentResponse): ContextPayload[] {
  const grouped = new Map<ContextPayload['matchType'], ContextPayload['matches']>();

  for (const match of result.matches) {
    const group = grouped.get(match.matchType) || [];
    group.push(match);
    grouped.set(match.matchType, group);
  }

  return [...grouped.entries()].map(([matchType, matches]) => ({
    matchType,
    matches,
    provenance: {
      sourceIds: matches.map((match) => match.sourceId),
      connectorIds: [...new Set(matches.map((match) => match.connectorId))],
      syncedAt: matches[0]?.syncedAt,
    },
  }));
}

export function createSummaryPayload(allBullets: SummaryBullet[], newBulletCount: number): SummaryPayload {
  return {
    bullets: allBullets.map((bullet, index) => ({
      ...bullet,
      isNew: index >= allBullets.length - newBulletCount,
    })),
  };
}
