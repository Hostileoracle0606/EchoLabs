import crypto from 'crypto';
import defaultContext from '@/data/mock-context.json';
import keynoteContext from '@/data/keynote-context.json';
import corporateContext from '@/data/mock-corporate.json';
import { getStoreSnapshot, updateStore } from './store';
import type { SourceChunkRecord, SourceProvenance, SourceRecord } from './types';

const DEMO_SOURCES: Record<string, typeof defaultContext> = {
  default: defaultContext,
  keynote: keynoteContext,
  corporate: corporateContext,
};

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function getActiveDemoMode(): keyof typeof DEMO_SOURCES | null {
  const configuredDemoMode = process.env.DEMO_MODE;
  if (configuredDemoMode && configuredDemoMode in DEMO_SOURCES) {
    return configuredDemoMode as keyof typeof DEMO_SOURCES;
  }

  return process.env.NODE_ENV === 'production' ? null : 'corporate';
}

function buildKeywords(entry: Record<string, unknown>): string[] {
  const rawKeywords = Array.isArray(entry.keywords) ? entry.keywords.filter((value): value is string => typeof value === 'string') : [];
  return rawKeywords.map((keyword) => keyword.toLowerCase());
}

function buildTextBlob(entry: Record<string, unknown>): string {
  return Object.values(entry)
    .flatMap((value) => {
      if (typeof value === 'string') {
        return [value];
      }
      if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string');
      }
      return [];
    })
    .join(' ');
}

export function seedDemoSourcesForWorkspace(workspaceId: string): void {
  const demoMode = getActiveDemoMode();
  if (!demoMode) {
    return;
  }

  updateStore((store) => {
    const connectorId = `demo-${demoMode}`;
    if (store.sources.some((source) => source.workspaceId === workspaceId && source.connectorId === connectorId)) {
      return;
    }

    const timestamp = nowIso();
    const sourceSets = DEMO_SOURCES[demoMode];

    const seedRecords = <T extends Record<string, unknown>>(
      items: T[],
      sourceType: SourceRecord['sourceType'],
      mapRecord: (item: T) => { title: string; ownerLabel?: string; preview: string }
    ) => {
      for (const item of items) {
        const record = mapRecord(item);
        const sourceId = createId('source');
        store.sources.push({
          id: sourceId,
          workspaceId,
          connectorId,
          connectorType: 'demo',
          sourceType,
          externalId: String(item.id),
          title: record.title,
          ownerLabel: record.ownerLabel,
          syncedAt: timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
        store.sourceChunks.push({
          id: createId('chunk'),
          sourceId,
          workspaceId,
          content: buildTextBlob(item),
          preview: record.preview,
          keywords: buildKeywords(item),
          createdAt: timestamp,
        });
      }
    };

    seedRecords(sourceSets.emails, 'email', (item) => ({
      title: String(item.subject || 'Email'),
      ownerLabel: String(item.from || ''),
      preview: String(item.preview || ''),
    }));
    seedRecords(sourceSets.documents, 'doc', (item) => ({
      title: String(item.title || 'Document'),
      preview: String(item.preview || ''),
    }));
    seedRecords(sourceSets.calendar, 'calendar', (item) => ({
      title: String(item.title || 'Calendar Event'),
      ownerLabel: Array.isArray(item.attendees) ? item.attendees.join(', ') : undefined,
      preview: Array.isArray(item.attendees)
        ? `${String(item.time || '')} — ${item.attendees.join(', ')}`
        : String(item.time || ''),
    }));
    seedRecords(sourceSets.slack, 'slack', (item) => ({
      title: `${String(item.channel || 'Slack')} — ${String(item.from || 'Unknown')}`,
      ownerLabel: String(item.from || ''),
      preview: String(item.message || ''),
    }));
  });
}

function scoreQuery(queryWords: string[], chunk: SourceChunkRecord): number {
  let score = 0;
  const content = chunk.content.toLowerCase();

  for (const word of queryWords) {
    if (chunk.keywords.some((keyword) => keyword.includes(word) || word.includes(keyword))) {
      score += 2;
    } else if (content.includes(word)) {
      score += 1;
    }
  }

  return queryWords.length > 0 ? score / (queryWords.length * 2) : 0;
}

export function searchWorkspaceSources(
  workspaceId: string,
  query: string,
  options?: {
    limit?: number;
    sourceTypes?: SourceRecord['sourceType'][];
  }
): Array<{
  source: SourceRecord;
  chunk: SourceChunkRecord;
  score: number;
  provenance: SourceProvenance;
}> {
  seedDemoSourcesForWorkspace(workspaceId);

  const store = getStoreSnapshot();
  const allowedTypes = options?.sourceTypes;
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const ranked = store.sourceChunks
    .filter((chunk) => chunk.workspaceId === workspaceId)
    .map((chunk) => {
      const source = store.sources.find((entry) => entry.id === chunk.sourceId);
      if (!source) {
        return null;
      }
      if (allowedTypes && !allowedTypes.includes(source.sourceType)) {
        return null;
      }

      const score = scoreQuery(queryWords, chunk);
      if (score <= 0) {
        return null;
      }

      return {
        source,
        chunk,
        score,
        provenance: {
          sourceId: source.id,
          connectorId: source.connectorId,
          connectorType: source.connectorType,
          syncedAt: source.syncedAt,
        },
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((left, right) => right.score - left.score);

  return ranked.slice(0, options?.limit || 3);
}
