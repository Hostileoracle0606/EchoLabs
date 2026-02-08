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
          theme: 'dark',
          themeVariables: {
            primaryColor: '#00e5a0',
            primaryTextColor: '#e4e4f0',
            lineColor: '#5b8def',
            secondaryColor: '#1a1a28',
            tertiaryColor: '#151520',
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
          ref.current.innerHTML = `<pre style="color:#f87171;font-size:12px;padding:8px;white-space:pre-wrap">${code}</pre>`;
        }
      }
    }

    render();
    return () => { cancelled = true; };
  }, [code, id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 0.6 }}
      className="rounded-xl border border-white/10 bg-[#1a1a28] p-4"
    >
      {title && (
        <h3 className="mb-2 text-sm font-medium text-white/70">{title}</h3>
      )}
      <div ref={ref} className="overflow-x-auto" />
      {narration && !error && (
        <p className="mt-2 text-xs text-white/50 italic">{narration}</p>
      )}
    </motion.div>
  );
}
