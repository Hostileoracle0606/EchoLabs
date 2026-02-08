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
      className="flex-1 overflow-y-auto rounded-xl border border-white/10 bg-[#0d0d14] p-4"
    >
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
        Live Transcript
      </h2>
      <div className="space-y-1 text-sm leading-relaxed">
        <AnimatePresence mode="popLayout">
          {chunks.map((chunk) => (
            <motion.span
              key={chunk.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/90"
            >
              {chunk.text}{' '}
            </motion.span>
          ))}
        </AnimatePresence>
        {interimText && (
          <span className="text-white/40 italic">{interimText}</span>
        )}
      </div>
    </div>
  );
}
