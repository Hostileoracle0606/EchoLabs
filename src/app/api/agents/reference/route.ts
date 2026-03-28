import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { findReferences } from '@/services/reference/reference.service';
import { broadcast } from '@/websocket/ws-server';
import { requireViewer } from '@/server/foundation/auth';
import { createAgentStatus, createReferencePayload } from '@/server/agent-payloads';

const ReferenceRequestSchema = z.object({
  intent: z.object({
    type: z.literal('REFERENCE'),
    confidence: z.number(),
    excerpt: z.string(),
    priority: z.number(),
  }),
  context: z.string(),
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireViewer();
    const body = await request.json();
    const parsed = ReferenceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    broadcast('agent:status', parsed.data.sessionId, createAgentStatus('reference', 'processing'));

    const result = await findReferences({
      ...parsed.data,
      workspaceId: viewer.workspace.id,
    });

    broadcast('agent:reference', parsed.data.sessionId, createReferencePayload(result));

    broadcast('agent:status', parsed.data.sessionId, createAgentStatus('reference', 'complete'));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Reference Agent] Error:', error);
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
