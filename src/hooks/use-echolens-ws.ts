'use client';

import { useEffect, useRef } from 'react';
import { useEchoLensStore } from '@/store/echolens-store';

export function useEchoLensWs() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useEchoLensStore((s) => s.sessionId);

  useEffect(() => {
    let disposed = false;

    const connect = () => {
      if (disposed || !sessionId || eventSourceRef.current) {
        return;
      }

      const stream = new EventSource(`/api/events?sessionId=${encodeURIComponent(sessionId)}`);
      eventSourceRef.current = stream;

      stream.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'connected') {
            return;
          }

          const store = useEchoLensStore.getState();
          switch (msg.event) {
            case 'agent:chart':
              store.addChart(msg.payload);
              break;
            case 'agent:reference':
              store.addReferences(msg.payload);
              break;
            case 'agent:context':
              store.addContextMatch(msg.payload);
              break;
            case 'agent:summary':
              store.updateSummary(msg.payload.bullets);
              break;
            case 'agent:status':
              store.setAgentStatus(msg.payload.agent, msg.payload.status);
              break;
          }
        } catch {
          // Ignore malformed messages
        }
      };

      stream.onerror = () => {
        stream.close();
        eventSourceRef.current = null;
        if (!disposed) {
          reconnectTimeoutRef.current = setTimeout(connect, 2000);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [sessionId]);

  return { stream: eventSourceRef };
}
