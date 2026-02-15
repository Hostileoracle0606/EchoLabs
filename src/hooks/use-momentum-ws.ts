'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMomentumStore } from '@/store/momentum-store';

export function useMomentumWs() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionId = useMomentumStore((s) => s.sessionId);
  const lastSessionIdRef = useRef<string>('');

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
      lastSessionIdRef.current = sessionId;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const store = useMomentumStore.getState();

        switch (msg.event) {
          case 'transcript:update':
            if (msg.payload?.schemaVersion === 2) {
              if (msg.payload.isFinal) {
                store.addTranscriptChunk(
                  msg.payload.text,
                  msg.payload.isFinal,
                  msg.payload.speaker,
                  msg.payload.timestamp,
                  msg.payload.speakerId
                );
              } else {
                store.setInterimText(msg.payload.text);
              }
              if (msg.payload.callId) {
                store.setCallId(msg.payload.callId);
              }
            } else if (typeof msg.payload?.text === 'string') {
              if (msg.payload.isFinal) {
                store.addTranscriptChunk(msg.payload.text, true);
              } else {
                store.setInterimText(msg.payload.text);
              }
            }
            break;
          case 'sales:stage':
            store.setSalesStage(msg.payload.stage);
            if (msg.payload.callId) {
              store.setCallId(msg.payload.callId);
            }
            break;
          case 'sales:objection':
            store.addObjections(msg.payload.objections || []);
            break;
          case 'sales:buying-signal':
            store.addBuyingSignals(msg.payload.signals || []);
            break;
          case 'sales:next-step':
            store.addNextSteps(msg.payload.steps || []);
            break;
          case 'sales:coaching':
            store.addCoachingTips(msg.payload.tips || []);
            break;
          case 'sales:compliance':
            store.addComplianceWarnings(msg.payload.warnings || []);
            break;
          case 'sales:summary':
            if (msg.payload?.summary) {
              store.setCallSummary(msg.payload.summary);
            }
            if (msg.payload?.callId) {
              store.setCallId(msg.payload.callId);
            }
            break;
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
          case 'voice:status':
            if (msg.payload?.status === 'stopped' || msg.payload?.status === 'error') {
              store.setRecording(false);
            }
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

  useEffect(() => {
    if (!sessionId) return;
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN && lastSessionIdRef.current !== sessionId) {
      ws.send(
        JSON.stringify({
          event: 'session:start',
          sessionId,
          timestamp: Date.now(),
          payload: {},
        })
      );
      lastSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  return { ws: wsRef };
}
