import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    agents: {
      orchestrator: true,
      salesDirector: true,
      productExpert: true,
      objectionHandler: true,
      qualifier: true,
      closing: true,
    },
  });
}
