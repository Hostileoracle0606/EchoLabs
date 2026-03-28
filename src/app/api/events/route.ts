import { NextRequest } from 'next/server';
import { requireViewer } from '@/server/foundation/auth';
import { subscribeToSessionEvents } from '@/server/session-events';

export async function GET(request: NextRequest) {
  try {
    await requireViewer();
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (payload: string) => {
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      send(JSON.stringify({ event: 'connected', sessionId }));

      const unsubscribe = subscribeToSessionEvents(sessionId, send);
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
