import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { findContextMatches } from '@/services/context/context.service';
import { broadcast } from '@/websocket/ws-server';

const ContextRequestSchema = z.object({
  intent: z.object({
    type: z.enum(['EMAIL_MENTION', 'DOC_MENTION']),
    confidence: z.number(),
    excerpt: z.string(),
    priority: z.number(),
  }),
  context: z.string(),
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let sessionId = '';
  try {
    const body = await request.json();
    const parsed = ContextRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    sessionId = parsed.data.sessionId;

    broadcast('agent:status', sessionId, {
      agent: 'context',
      status: 'processing',
    });

    const result = findContextMatches(parsed.data);

    if (result.matches.length > 0) {
      // Group matches by matchType so each broadcast has the correct type.
      // Without this, a mixed result (email + doc) would all display as the
      // first match's type — e.g., a doc showing with an email icon.
      const grouped = new Map<string, typeof result.matches>();
      for (const match of result.matches) {
        const group = grouped.get(match.matchType) || [];
        group.push(match);
        grouped.set(match.matchType, group);
      }

      for (const [matchType, matches] of grouped) {
        broadcast('context:match', sessionId, {
          matchType,
          matches,
        });
      }
    }

    broadcast('agent:status', sessionId, {
      agent: 'context',
      status: 'complete',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Context Agent] Error:', error);
    if (sessionId) {
      broadcast('agent:status', sessionId, {
        agent: 'context',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
