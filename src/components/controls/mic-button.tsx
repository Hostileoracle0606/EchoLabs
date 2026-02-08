'use client';

import { useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { useDeepgram } from '@/hooks/use-deepgram';
import { useEchoLensStore } from '@/store/echolens-store';
import { TranscriptBufferManager } from '@/lib/transcript-buffer';

export function MicButton() {
  const { isRecording, setRecording, addTranscriptChunk, setInterimText, sessionId } =
    useEchoLensStore();

  const bufferRef = useRef(new TranscriptBufferManager(sessionId));
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sweepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const onTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        addTranscriptChunk(text, true);
        bufferRef.current.addChunk(text, true);
      } else {
        setInterimText(text);
      }
    },
    [addTranscriptChunk, setInterimText]
  );

  const { start: startDeepgram, stop: stopDeepgram } = useDeepgram({
    onTranscript,
    onError: (err) => console.error('[Deepgram]', err),
  });

  const sendToOrchestrator = useCallback(async () => {
    const text = bufferRef.current.flushUnsent();
    if (!text.trim()) return;

    try {
      await fetch('/api/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          timestamp: Date.now(),
          sessionId,
          context: bufferRef.current.getRollingTranscript(180000), // last 3 min
        }),
      });
    } catch (err) {
      console.error('[Orchestrator send]', err);
    }
  }, [sessionId]);

  const sendSweep = useCallback(async () => {
    const fullText = bufferRef.current.getRollingTranscript(180000);
    if (!fullText.trim()) return;

    try {
      await fetch('/api/agents/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'sweep',
          fullTranscript: fullText,
          sessionId,
        }),
      });
    } catch (err) {
      console.error('[Summary sweep]', err);
    }
  }, [sessionId]);

  const handleToggle = useCallback(async () => {
    if (isRecording) {
      stopDeepgram();
      setRecording(false);
      if (sendIntervalRef.current) clearInterval(sendIntervalRef.current);
      if (sweepIntervalRef.current) clearInterval(sweepIntervalRef.current);
      // Send any remaining text
      await sendToOrchestrator();
    } else {
      await startDeepgram();
      setRecording(true);
      // Send transcript chunks every 4 seconds
      sendIntervalRef.current = setInterval(sendToOrchestrator, 4000);
      // Run summary sweep every 30 seconds
      sweepIntervalRef.current = setInterval(sendSweep, 30000);
    }
  }, [isRecording, startDeepgram, stopDeepgram, setRecording, sendToOrchestrator, sendSweep]);

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all ${isRecording
          ? 'bg-red-500 shadow-lg shadow-red-500/25'
          : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25'
        }`}
      title={isRecording ? 'Stop recording' : 'Start recording'}
    >
      {isRecording ? (
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="h-3.5 w-3.5 rounded-sm bg-white"
        />
      ) : (
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
        </svg>
      )}

      {isRecording && (
        <motion.div
          animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-xl bg-red-500"
        />
      )}
    </motion.button>
  );
}
