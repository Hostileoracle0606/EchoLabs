'use client';

import { useCallback, useRef, useState } from 'react';

interface UseDeepgramOptions {
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseDeepgramReturn {
  isRecording: boolean;
  start: () => Promise<void>;
  stop: () => void;
}

export function useDeepgram({ onTranscript, onError }: UseDeepgramOptions): UseDeepgramReturn {
  const [isRecording, setIsRecording] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const start = useCallback(async () => {
    try {
      // Get temporary token from our server
      const tokenRes = await fetch('/api/deepgram/token');
      const { token } = await tokenRes.json();
      if (!token) {
        onError?.('No Deepgram token available');
        return;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Deepgram WebSocket
      const ws = new WebSocket(
        `wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&interim_results=true&endpointing=300`,
        ['token', token]
      );
      wsRef.current = ws;

      ws.onopen = () => {
        setIsRecording(true);

        // Start recording and sending audio chunks
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
            ws.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send audio every 250ms
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const transcript = data?.channel?.alternatives?.[0]?.transcript;
          if (transcript) {
            const isFinal = data.is_final === true;
            onTranscript(transcript, isFinal);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onerror = () => {
        onError?.('Deepgram WebSocket error');
        stop();
      };

      ws.onclose = () => {
        setIsRecording(false);
      };
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to start recording');
      stop();
    }
  }, [onTranscript, onError, stop]);

  return { isRecording, start, stop };
}
