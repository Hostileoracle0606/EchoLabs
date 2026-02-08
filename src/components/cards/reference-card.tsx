'use client';

import { motion } from 'motion/react';

interface ReferenceSource {
  title: string;
  url: string;
  snippet: string;
  confidence: 'verified' | 'partial' | 'unverified';
  domain: string;
}

interface ReferenceCardProps {
  sources: ReferenceSource[];
  query: string;
}

const CONFIDENCE_STYLES = {
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Verified' },
  partial: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Partial' },
  unverified: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Unverified' },
};

export function ReferenceCard({ sources, query }: ReferenceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ type: 'spring', duration: 0.45 }}
      className="space-y-3"
    >
      {sources.map((source, i) => {
        const style = CONFIDENCE_STYLES[source.confidence];
        return (
          <div
            key={i}
            className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {source.title}
                </a>
                <p className="mt-0.5 text-[11px] text-slate-400">{source.domain}</p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text} ${style.border}`}
              >
                {style.label}
              </span>
            </div>
            {source.snippet && (
              <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
                {source.snippet}
              </p>
            )}
          </div>
        );
      })}
      <p className="text-[11px] text-slate-400">
        Search: <span className="font-medium text-slate-500">&quot;{query}&quot;</span>
      </p>
    </motion.div>
  );
}
