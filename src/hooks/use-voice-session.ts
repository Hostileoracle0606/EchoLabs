'use client';

import { useCallback, useRef, useState } from 'react';

interface UseVoiceSessionOptions {
  sessionId: string;
  callId: string;
  customerId?: string;
  phoneNumber?: string;
  onError?: (error: string) => void;
}

interface UseVoiceSessionReturn {
  isStreaming: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useVoiceSession({
  sessionId,
  callId,
  customerId,
  phoneNumber,
  onError,
}: UseVoiceSessionOptions): UseVoiceSessionReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            event: 'voice:stop',
            sessionId,
            timestamp: Date.now(),
            payload: {},
          })
        );
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
  }, [sessionId]);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            event: 'session:start',
            sessionId,
            timestamp: Date.now(),
            payload: {},
          })
        );
        ws.send(
          JSON.stringify({
            event: 'voice:start',
            sessionId,
            timestamp: Date.now(),
            payload: {
              callId,
              customerId,
              phoneNumber,
            },
          })
        );

        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorderRef.current = recorder;
        recorder.ondataavailable = async (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };
        recorder.start(250);
        setIsStreaming(true);
      };

      ws.onerror = () => {
        onError?.('Voice WebSocket error');
        stop();
      };

      ws.onclose = () => {
        setIsStreaming(false);
        wsRef.current = null;
      };
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to start voice session');
      stop();
      throw err;
    }
  }, [callId, customerId, phoneNumber, sessionId, onError, stop]);

  return { isStreaming, start, stop };
}
