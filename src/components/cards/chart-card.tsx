'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface MermaidChartProps {
  code: string;
  id: string;
  title?: string;
  narration?: string;
}

export function MermaidChart({ code, id, title, narration }: MermaidChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ref.current || !code) return;

    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          themeVariables: {
            primaryColor: '#eff6ff',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#93c5fd',
            lineColor: '#6366f1',
            secondaryColor: '#f0fdf4',
            tertiaryColor: '#f5f3ff',
            noteBkgColor: '#fefce8',
            noteTextColor: '#1e293b',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13px',
          },
        });

        const { svg } = await mermaid.render(`mermaid-${id}`, code);
        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
          setError(false);
        }
      } catch {
        if (!cancelled && ref.current) {
          setError(true);
          ref.current.innerHTML = `<pre style="color:#dc2626;font-size:12px;padding:8px;white-space:pre-wrap;background:#fef2f2;border-radius:8px">${code}</pre>`;
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code, id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
    >
      {title && (
        <h3 className="mb-3 text-sm font-medium text-slate-700">{title}</h3>
      )}
      <div ref={ref} className="mermaid-container overflow-x-auto" />
      {narration && !error && (
        <p className="mt-3 text-xs leading-relaxed text-slate-500 italic">{narration}</p>
      )}
    </motion.div>
  );
}
