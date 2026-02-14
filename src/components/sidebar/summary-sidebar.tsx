'use client';

import { motion, AnimatePresence } from 'motion/react';

interface SummaryBulletDisplay {
  id: string;
  text: string;
  category: 'key_point' | 'decision' | 'action_item' | 'question';
  owner?: string;
  timestamp: number;
  isNew?: boolean;
}

interface SummarySidebarProps {
  bullets: SummaryBulletDisplay[];
}

const CATEGORY_CONFIG = {
  key_point: { icon: '●', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Key Point' },
  decision: { icon: '✓', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Decision' },
  action_item: { icon: '⚑', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', label: 'Action' },
  question: { icon: '?', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', label: 'Question' },
};

export function SummarySidebar({ bullets }: SummarySidebarProps) {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-[var(--glass-border)] glass-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--foreground-muted)]">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
          Session Highlights
        </h2>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {bullets.map((bullet) => {
            const config = CATEGORY_CONFIG[bullet.category];
            return (
              <motion.div
                key={bullet.id}
                initial={{ opacity: 0, x: -12, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 12, height: 0 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className={`rounded-xl border ${config.border} ${config.bg} px-3 py-2`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 text-xs font-semibold ${config.color}`}>
                    {config.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-[var(--foreground)]">
                      {bullet.text}
                    </p>
                    {bullet.owner && (
                      <p className="mt-0.5 text-[10px] text-[var(--foreground-subtle)]">
                        Owner: {bullet.owner}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 text-[9px] font-medium uppercase ${config.color}`}>
                    {config.label}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {bullets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-2xl opacity-30 grayscale">💡</span>
            <p className="mt-2 text-xs text-[var(--foreground-muted)]">
              Key points will appear here as the conversation progresses...
            </p>
          </div>
        )}
      </div>

      {bullets.length > 0 && (
        <div className="mt-2 flex gap-3 border-t border-[var(--glass-border)] pt-2.5">
          {(['key_point', 'decision', 'action_item', 'question'] as const).map((cat) => {
            const count = bullets.filter((b) => b.category === cat).length;
            if (count === 0) return null;
            const config = CATEGORY_CONFIG[cat];
            return (
              <span key={cat} className={`flex items-center gap-1 text-[10px] font-medium ${config.color}`}>
                {config.icon} {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
