import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { generateChart } from '@/services/chart/chart.service';
import { broadcast } from '@/websocket/ws-server';
import type { ChartPayload } from '@/types/events';

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
  try {
    const body = await request.json();
    const parsed = ChartRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.format() },
        { status: 400 }
      );
    }

    broadcast('agent:status', parsed.data.sessionId, {
      agent: 'chart',
      status: 'processing',
    });

    const result = await generateChart(parsed.data);

    const chartPayload: ChartPayload = {
      mermaidCode: result.mermaidCode,
      chartType: result.chartType,
      title: result.title,
      sourceExcerpt: parsed.data.intent.excerpt,
      narration: result.narration,
    };

    broadcast('chart:render', parsed.data.sessionId, chartPayload);
    broadcast('agent:status', parsed.data.sessionId, {
      agent: 'chart',
      status: 'complete',
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Chart Agent] Error:', error);
    broadcast('agent:status', parsed?.data?.sessionId ?? '', {
      agent: 'chart',
      status: 'error',
      message: error instanceof Error ? error.message : 'Chart generation failed',
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
