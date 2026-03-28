import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { processSummaryIntent, processTranscriptSweep, getSessionBullets } from '@/services/summary/summary.service';
import { broadcast } from '@/websocket/ws-server';
import { requireViewer } from '@/server/foundation/auth';
import { resolveWorkspaceProviderSecret } from '@/server/foundation/providers';

const SummaryRequestSchema = z.object({
  intent: z.object({
    type: z.enum(['KEY_POINT', 'DECISION', 'ACTION_ITEM', 'QUESTION']),
    confidence: z.number(),
    excerpt: z.string(),
    priority: z.number(),
  }),
  context: z.string(),
  sessionId: z.string().min(1),
  fullTranscript: z.string().optional(),
});

const SweepRequestSchema = z.object({
  mode: z.literal('sweep'),
  fullTranscript: z.string().min(1),
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireViewer();
    const body = await request.json();

    // Check if this is a sweep request
    const sweepParsed = SweepRequestSchema.safeParse(body);
    if (sweepParsed.success) {
      broadcast('agent:status', sweepParsed.data.sessionId, {
        agent: 'summary',
        status: 'processing',
      });

      const result = await processTranscriptSweep(
        sweepParsed.data.fullTranscript,
        sweepParsed.data.sessionId,
        resolveWorkspaceProviderSecret(viewer.workspace.id, 'gemini', 'GEMINI_API_KEY') ||
          undefined
      );

      if (result.bullets.length > 0) {
        const allBullets = getSessionBullets(sweepParsed.data.sessionId);
        broadcast('agent:summary', sweepParsed.data.sessionId, {
          bullets: allBullets.map((b, i) => ({
            ...b,
            isNew: i >= allBullets.length - result.bullets.length,
          })),
        });
      }

      broadcast('agent:status', sweepParsed.data.sessionId, {
        agent: 'summary',
        status: 'complete',
      });

      return NextResponse.json(result);
    }

    // Otherwise treat as single intent
    const parsed = SummaryRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await processSummaryIntent(parsed.data);

    if (result.bullets.length > 0) {
      const allBullets = getSessionBullets(parsed.data.sessionId);
      broadcast('agent:summary', parsed.data.sessionId, {
        bullets: allBullets.map((b, i) => ({
          ...b,
          isNew: i >= allBullets.length - result.bullets.length,
        })),
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Summary Agent] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === 'UNAUTHENTICATED'
            ? 'Unauthorized'
            : 'Internal server error',
      },
      { status: error instanceof Error && error.message === 'UNAUTHENTICATED' ? 401 : 500 }
    );
  }
}
