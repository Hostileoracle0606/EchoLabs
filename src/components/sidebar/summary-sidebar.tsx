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
  key_point: { icon: '●', color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Key Point' },
  decision: { icon: '✓', color: 'text-green-400', bg: 'bg-green-500/10', label: 'Decision' },
  action_item: { icon: '⚑', color: 'text-red-400', bg: 'bg-red-500/10', label: 'Action Item' },
  question: { icon: '?', color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Question' },
};

export function SummarySidebar({ bullets }: SummarySidebarProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-white/10 bg-[#0d0d14] p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">
        Summary
      </h2>

      <div className="flex-1 space-y-2 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {bullets.map((bullet) => {
            const config = CATEGORY_CONFIG[bullet.category];
            return (
              <motion.div
                key={bullet.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ type: 'spring', duration: 0.4 }}
                className={`rounded-lg ${config.bg} px-3 py-2`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 text-sm ${config.color}`}>{config.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs leading-relaxed text-white/80">
                      {bullet.text}
                    </p>
                    {bullet.owner && (
                      <p className="mt-0.5 text-[10px] text-white/40">
                        Owner: {bullet.owner}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {bullets.length === 0 && (
          <p className="text-center text-xs text-white/20 py-8">
            Key points will appear here as the conversation progresses...
          </p>
        )}
      </div>

      {bullets.length > 0 && (
        <div className="mt-2 flex gap-3 border-t border-white/5 pt-2">
          {(['key_point', 'decision', 'action_item', 'question'] as const).map((cat) => {
            const count = bullets.filter((b) => b.category === cat).length;
            if (count === 0) return null;
            const config = CATEGORY_CONFIG[cat];
            return (
              <span key={cat} className={`text-[10px] ${config.color}`}>
                {config.icon} {count}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
