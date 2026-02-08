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
  verified: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Verified' },
  partial: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Partial Match' },
  unverified: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Unverified' },
};

export function ReferenceCard({ sources, query }: ReferenceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="rounded-xl border border-white/10 bg-[#1a1a28] p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
          Source Reference
        </h3>
      </div>

      {sources.map((source, i) => {
        const style = CONFIDENCE_STYLES[source.confidence];
        return (
          <div key={i} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                {source.title}
              </a>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.bg} ${style.text}`}>
                {style.label}
              </span>
            </div>
            <p className="text-xs text-white/50">{source.domain}</p>
            {source.snippet && (
              <p className="text-xs leading-relaxed text-white/70">{source.snippet}</p>
            )}
          </div>
        );
      })}

      <p className="mt-2 text-[10px] text-white/30">Search: &quot;{query}&quot;</p>
    </motion.div>
  );
}
