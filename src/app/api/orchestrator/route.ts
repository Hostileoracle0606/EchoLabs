import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { processTranscript } from '@/services/orchestrator/orchestrator.service';

const OrchestratorRequestSchema = z.object({
  text: z.string().min(1),
  timestamp: z.number(),
  sessionId: z.string().min(1),
  context: z.string().optional(),
  callId: z.string().optional(),
  customerId: z.string().optional(),
  speaker: z.enum(['customer', 'agent', 'system']).optional(),
  schemaVersion: z.number().optional(),
});

import { broadcast } from '@/websocket/ws-server';

export async function POST(request: NextRequest) {
  let sessionId = '';
  try {
    const body = await request.json();
    const parsed = OrchestratorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    sessionId = parsed.data.sessionId;

    // 1. Set status to processing
    broadcast('agent:status', sessionId, {
      agent: 'sales-director',
      status: 'processing',
    });

    const result = await processTranscript(parsed.data);

    // 2. Set status to complete
    broadcast('agent:status', sessionId, {
      agent: 'sales-director',
      status: 'complete',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Orchestrator] Error:', error);

    if (sessionId) {
      broadcast('agent:status', sessionId, {
        agent: 'sales-director',
        status: 'error',
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
