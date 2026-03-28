import type { AgentRequest, ReferenceAgentResponse, Source } from '@/types/agents';
import { searchWorkspaceSources } from '@/server/foundation/sources';

export async function findReferences(request: AgentRequest): Promise<ReferenceAgentResponse> {
  const { intent } = request;
  const query = intent.excerpt;

  if (process.env.MOCK_MODE === 'true') {
    const source: Source = {
      sourceId: 'mock-source',
      connectorId: 'mock-connector',
      connectorType: 'mock',
      syncedAt: new Date().toISOString(),
      title: 'Mock reference source',
      url: 'https://example.com/mock-reference',
      snippet: `Demo-mode placeholder for: ${intent.excerpt}`,
      confidence: 'unverified',
      domain: 'example.com',
    };
    return { sources: [source], query };
  }

  if (!request.workspaceId) {
    return { sources: [], query };
  }

  const sources = searchWorkspaceSources(request.workspaceId, query, {
    limit: 3,
    sourceTypes: ['doc', 'email', 'slack'],
  }).map(({ source, chunk, score, provenance }) => ({
    sourceId: provenance.sourceId,
    connectorId: provenance.connectorId,
    connectorType: provenance.connectorType,
    syncedAt: provenance.syncedAt,
    title: source.title,
    url: source.url,
    snippet: chunk.preview,
    confidence: score > 0.75 ? 'verified' : score > 0.45 ? 'partial' : 'unverified',
    domain: source.connectorType,
  })) satisfies Source[];

  return { sources, query };
}
