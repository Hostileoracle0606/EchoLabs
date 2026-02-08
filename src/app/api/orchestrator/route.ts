import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { processTranscript } from '@/services/orchestrator/orchestrator.service';

const OrchestratorRequestSchema = z.object({
  text: z.string().min(1),
  timestamp: z.number(),
  sessionId: z.string().min(1),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = OrchestratorRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await processTranscript(parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Orchestrator] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
