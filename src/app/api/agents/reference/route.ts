import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { findReferences } from '@/services/reference/reference.service';
import { broadcast } from '@/websocket/ws-server';

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
    const body = await request.json();
    const parsed = ReferenceRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    broadcast('agent:status', parsed.data.sessionId, {
      agent: 'reference',
      status: 'processing',
    });

    const result = await findReferences(parsed.data);

    broadcast('reference:found', parsed.data.sessionId, {
      sources: result.sources,
      query: result.query,
    });

    broadcast('agent:status', parsed.data.sessionId, {
      agent: 'reference',
      status: 'complete',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Reference Agent] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
