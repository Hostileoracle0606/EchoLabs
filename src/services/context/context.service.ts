import type { AgentRequest, ContextAgentResponse, ContextMatch } from '@/types/agents';
import { searchWorkspaceSources } from '@/server/foundation/sources';

const MIN_SCORE_THRESHOLD = 0.3;
const MAX_RESULTS = 3;

export async function findContextMatches(request: AgentRequest): Promise<ContextAgentResponse> {
  if (!request.workspaceId) {
    return { matches: [] };
  }

  const matches: ContextMatch[] = searchWorkspaceSources(request.workspaceId, request.intent.excerpt, {
    limit: MAX_RESULTS,
    sourceTypes: ['email', 'doc', 'calendar', 'slack'],
  })
    .filter((result) => result.score >= MIN_SCORE_THRESHOLD)
    .map(({ source, chunk, score, provenance }) => ({
      id: source.id,
      sourceId: provenance.sourceId,
      connectorId: provenance.connectorId,
      connectorType: provenance.connectorType,
      syncedAt: provenance.syncedAt,
      matchType: source.sourceType as ContextMatch['matchType'],
      title: source.title,
      preview: chunk.preview,
      from: source.sourceType === 'email' || source.sourceType === 'slack' ? source.ownerLabel : undefined,
      date: provenance.syncedAt,
      channel:
        source.sourceType === 'slack' && source.title.includes('—')
          ? source.title.split('—')[0]?.trim()
          : undefined,
      fileType: source.sourceType === 'doc' ? 'doc' : undefined,
      relevanceScore: score,
    }));

  return { matches };
}
