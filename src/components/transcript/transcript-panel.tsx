'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptChunkDisplay {
  id: string;
  text: string;
  isFinal: boolean;
}

interface TranscriptPanelProps {
  chunks: TranscriptChunkDisplay[];
  interimText: string;
}

export function TranscriptPanel({ chunks, interimText }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chunks, interimText]);

  return (
    <div
      ref={scrollRef}
      className="flex h-full flex-col overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Live Transcript
        </h2>
      </div>
      <div className="flex-1 space-y-0.5 text-[13px] leading-relaxed">
        <AnimatePresence mode="popLayout">
          {chunks.map((chunk) => (
            <motion.span
              key={chunk.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-700"
            >
              {chunk.text}{' '}
            </motion.span>
          ))}
        </AnimatePresence>
        {interimText && (
          <span className="text-slate-400 italic">{interimText}</span>
        )}
        {chunks.length === 0 && !interimText && (
          <p className="py-4 text-center text-xs text-slate-300">
            Start recording to see live transcript...
          </p>
        )}
      </div>
    </div>
  );
}
