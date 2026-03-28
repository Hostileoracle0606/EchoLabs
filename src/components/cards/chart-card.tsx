'use client';

import { motion } from 'motion/react';
import type { ChartSpec } from '@/types/charts';

interface StructuredChartProps {
  spec: ChartSpec;
  narration?: string;
}

const PIE_COLORS = ['#38bdf8', '#34d399', '#f59e0b', '#f472b6', '#818cf8', '#fb7185'];

function renderPieGradient(spec: Extract<ChartSpec, { kind: 'pie' }>): string {
  const total = spec.data.reduce((sum, entry) => sum + entry.value, 0) || 1;
  let cursor = 0;

  return spec.data
    .map((entry, index) => {
      const start = (cursor / total) * 100;
      cursor += entry.value;
      const end = (cursor / total) * 100;
      return `${PIE_COLORS[index % PIE_COLORS.length]} ${start}% ${end}%`;
    })
    .join(', ');
}

function BarChartView({ spec }: { spec: Extract<ChartSpec, { kind: 'bar' }> }) {
  const maxValue = Math.max(...spec.data.map((entry) => entry.value), 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {spec.data.map((entry, index) => (
          <div key={`${entry.label}-${index}`} className="grid grid-cols-[110px_1fr_56px] items-center gap-3 text-sm">
            <span className="truncate text-slate-300">{entry.label}</span>
            <div className="h-3 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
                style={{ width: `${Math.max((entry.value / maxValue) * 100, 8)}%` }}
              />
            </div>
            <span className="text-right font-mono text-slate-200">{entry.value}</span>
          </div>
        ))}
      </div>
      {(spec.xLabel || spec.yLabel) && (
        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
          {spec.xLabel || 'Items'} • {spec.yLabel || 'Value'}
        </p>
      )}
    </div>
  );
}

function PieChartView({ spec }: { spec: Extract<ChartSpec, { kind: 'pie' }> }) {
  const total = spec.data.reduce((sum, entry) => sum + entry.value, 0) || 1;

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-center">
      <div
        className="mx-auto h-[220px] w-[220px] rounded-full border border-white/10"
        style={{ background: `conic-gradient(${renderPieGradient(spec)})` }}
      />
      <div className="space-y-3">
        {spec.data.map((entry, index) => (
          <div key={`${entry.label}-${index}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
              />
              <span className="text-sm text-slate-200">{entry.label}</span>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm text-white">{entry.value}</p>
              <p className="text-[11px] text-slate-400">{Math.round((entry.value / total) * 100)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricChartView({ spec }: { spec: Extract<ChartSpec, { kind: 'metric' }> }) {
  const trendColor =
    spec.trend === 'up' ? 'text-emerald-300' : spec.trend === 'down' ? 'text-rose-300' : 'text-slate-300';

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{spec.subtitle || 'Headline Metric'}</p>
      <p className="mt-6 text-6xl font-semibold tracking-tight text-white">{spec.value}</p>
      {spec.detail ? <p className={`mt-4 text-sm ${trendColor}`}>{spec.detail}</p> : null}
    </div>
  );
}

export function StructuredChart({ spec, narration }: StructuredChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="w-full rounded-2xl border border-[var(--glass-border)] bg-[var(--bg-secondary)]/30 p-5 backdrop-blur-sm"
    >
      {spec.kind === 'bar' ? <BarChartView spec={spec} /> : null}
      {spec.kind === 'pie' ? <PieChartView spec={spec} /> : null}
      {spec.kind === 'metric' ? <MetricChartView spec={spec} /> : null}
      {narration ? (
        <p className="mt-4 text-center text-xs italic leading-relaxed text-[var(--foreground-muted)]">
          {narration}
        </p>
      ) : null}
    </motion.div>
  );
}
