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
  email: { icon: '✉️', label: 'Email', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
  doc: { icon: '📄', label: 'Document', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600' },
  calendar: { icon: '📅', label: 'Calendar', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  slack: { icon: '💬', label: 'Slack', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
};

export function ContextCard({ match, matchType }: ContextCardProps) {
  const config = TYPE_CONFIG[matchType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', duration: 0.4 }}
      className={`rounded-xl border ${config.border} bg-white p-4 transition-shadow hover:shadow-md`}
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{config.icon}</span>
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${config.text}`}>
            {config.label}
          </span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bg} ${config.text}`}>
          {Math.round(match.relevanceScore * 100)}% match
        </span>
      </div>

      <div className="space-y-1.5">
        {match.from && (
          <div className="flex items-center gap-2">
            {match.avatarColor && (
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: match.avatarColor }}
              >
                {match.from.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium text-slate-800">{match.from}</span>
          </div>
        )}
        <h4 className="text-sm font-medium text-slate-700">{match.title}</h4>
        {match.date && (
          <p className="text-[11px] text-slate-400">{match.date}</p>
        )}
        <p className="mt-1 text-xs leading-relaxed text-slate-500 line-clamp-3">
          {match.preview}
        </p>
      </div>
    </motion.div>
  );
}
