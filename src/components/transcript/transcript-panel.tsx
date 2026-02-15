'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptChunkDisplay {
  id: string;
  text: string;
  isFinal: boolean;
  speaker: 'customer' | 'agent' | 'system';
  speakerId?: number;
  timestamp: number;
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
      className="flex h-full flex-col overflow-y-auto rounded-3xl border border-[var(--glass-border)] glass-card p-4 shadow-sm"
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--foreground-muted)]">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
          </svg>
        </div>
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Live Transcript
        </h2>
      </div>
      <div className="flex-1 space-y-3 text-[13px] leading-relaxed">
        <AnimatePresence mode="popLayout">
          {chunks.map((chunk) => (
            <motion.div
              key={chunk.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col"
            >
              <span className="text-[10px] uppercase tracking-wide text-[var(--foreground-subtle)]">
                {typeof chunk.speakerId === 'number' ? `spk-${chunk.speakerId}` : chunk.speaker}
              </span>
              <span className="text-[var(--foreground)]">{chunk.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        {interimText && (
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-[var(--foreground-subtle)]">listening</span>
            <span className="text-[var(--foreground-muted)] italic">{interimText}</span>
          </div>
        )}
        {chunks.length === 0 && !interimText && (
          <p className="py-4 text-center text-xs text-[var(--foreground-subtle)]">
            Start recording to see live transcript...
          </p>
        )}
      </div>
    </div>
  );
}
