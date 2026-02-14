'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEchoLensStore } from '@/store/echolens-store';

export function useEchoLensWs() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useEchoLensStore((s) => s.sessionId);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      // Register session with server
      ws.send(
        JSON.stringify({
          event: 'session:start',
          sessionId,
          timestamp: Date.now(),
          payload: {},
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
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

    ws.onclose = () => {
      // Auto-reconnect after 2 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [sessionId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { ws: wsRef };
}
