import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { generateChart } from '@/services/chart/chart.service';
import { broadcast } from '@/websocket/ws-server';
import type { ChartPayload } from '@/types/events';
import { requireViewer } from '@/server/foundation/auth';
import { resolveWorkspaceProviderSecret } from '@/server/foundation/providers';
import { createAgentStatus, createChartPayload } from '@/server/agent-payloads';

const ChartRequestSchema = z.object({
  intent: z.object({
    type: z.literal('DATA_CLAIM'),
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
    const parsed = ChartRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    sessionId = parsed.data.sessionId;

    broadcast('agent:status', sessionId, createAgentStatus('chart', 'processing'));

    const result = await generateChart({
      ...parsed.data,
      providerApiKey:
        resolveWorkspaceProviderSecret(viewer.workspace.id, 'gemini', 'GEMINI_API_KEY') ||
        undefined,
    });
    console.log('[Chart Agent] Generated Result:', result);

    const chartPayload: ChartPayload = createChartPayload(result, parsed.data.intent.excerpt);

    console.log('[Chart Agent] Broadcasting Payload:', chartPayload);
    broadcast('agent:chart', sessionId, chartPayload);
    broadcast('agent:status', sessionId, createAgentStatus('chart', 'complete'));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Chart Agent] Error:', error);
    if (sessionId) {
      broadcast('agent:status', sessionId, {
        agent: 'chart',
        status: 'error',
        message: error instanceof Error ? error.message : 'Chart generation failed',
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
