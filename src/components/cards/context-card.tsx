'use client';

import { motion } from 'motion/react';
interface ContextCardMatch {
  id: string;
  title: string;
  preview: string;
  from?: string;
  date?: string;
  channel?: string;
  avatarColor?: string;
  fileType?: string;
  relevanceScore: number;
}

interface ContextCardProps {
  match: ContextCardMatch;
  matchType: 'email' | 'doc' | 'calendar' | 'slack';
}

const TYPE_CONFIG = {
  email: { icon: '✉', label: 'Email', color: 'border-blue-500/30' },
  doc: { icon: '📄', label: 'Document', color: 'border-purple-500/30' },
  calendar: { icon: '📅', label: 'Calendar', color: 'border-green-500/30' },
  slack: { icon: '💬', label: 'Slack', color: 'border-yellow-500/30' },
};

export function ContextCard({ match, matchType }: ContextCardProps) {
  const config = TYPE_CONFIG[matchType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={`rounded-xl border ${config.color} bg-[#1a1a28] p-4`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="text-base">{config.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">
          {config.label}
        </span>
      </div>

      <div className="space-y-1">
        {match.from && (
          <div className="flex items-center gap-2">
            {match.avatarColor && (
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: match.avatarColor }}
              >
                {match.from.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-white/90">{match.from}</span>
          </div>
        )}
        <h4 className="text-sm font-medium text-white/80">{match.title}</h4>
        {match.date && (
          <p className="text-[10px] text-white/40">{match.date}</p>
        )}
        <p className="mt-1 text-xs leading-relaxed text-white/60 line-clamp-3">
          {match.preview}
        </p>
      </div>
    </motion.div>
  );
}
