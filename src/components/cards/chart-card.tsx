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
            // Main Backgrounds
            primaryColor: '#eef2ff', // Indigo-50
            primaryTextColor: '#334155', // Slate-700
            primaryBorderColor: '#a5b4fc', // Indigo-300

            // Lines & Arrows
            lineColor: '#6366f1', // Indigo-500

            // Secondary Nodes
            secondaryColor: '#f0fdf4', // Emerald-50
            secondaryBorderColor: '#86efac', // Emerald-300
            secondaryTextColor: '#334155', // Slate-700

            // Tertiary Nodes
            tertiaryColor: '#faf5ff', // Purple-50
            tertiaryBorderColor: '#d8b4fe', // Purple-300
            tertiaryTextColor: '#334155', // Slate-700

            // Notes
            noteBkgColor: '#fffbeb', // Amber-50
            noteTextColor: '#92400e', // Amber-800
            noteBorderColor: '#fcd34d', // Amber-300

            // Fonts
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
      className="rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)]/30 p-5 backdrop-blur-sm"
    >
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      )}
      <div ref={ref} className="mermaid-container overflow-x-auto" />
      {narration && !error && (
        <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-muted)] italic text-center max-w-[90%] mx-auto">{narration}</p>
      )}
    </motion.div>
  );
}
