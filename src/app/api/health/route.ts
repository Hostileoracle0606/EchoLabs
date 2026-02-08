import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    agents: {
      orchestrator: true,
      chart: true,
      reference: true,
      context: true,
      summary: true,
    },
  });
}
