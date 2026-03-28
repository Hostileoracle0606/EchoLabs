import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { findContextMatches } from '@/services/context/context.service';
import { broadcast } from '@/websocket/ws-server';
import type { ClassifiedIntent } from '@/types/intents';
import { requireViewer } from '@/server/foundation/auth';
import { createAgentStatus, createContextPayloads } from '@/server/agent-payloads';

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
    const viewer = await requireViewer();
    const body = await request.json();
    const parsed = ContextRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    sessionId = parsed.data.sessionId;
    const { intent, context } = parsed.data;

    broadcast('agent:status', sessionId, createAgentStatus('context', 'processing'));

    const classifiedIntent: ClassifiedIntent = {
      ...intent,
      type: intent.type,
    };

    const response = await findContextMatches({
      intent: classifiedIntent,
      context,
      sessionId,
      workspaceId: viewer.workspace.id,
    });

    if (response.matches.length > 0) {
      for (const payload of createContextPayloads(response)) {
        broadcast('agent:context', sessionId, payload);
      }
    }

    broadcast('agent:status', sessionId, createAgentStatus('context', 'complete'));

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Context Agent] Error:', error);
    if (sessionId) {
      broadcast('agent:status', sessionId, {
        agent: 'context',
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
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
