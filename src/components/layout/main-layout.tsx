'use client';

import { useEffect } from 'react';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { useEchoLensStore } from '@/store/echolens-store';
import { useEchoLensWs } from '@/hooks/use-echolens-ws';
import { TranscriptPanel } from '@/components/transcript/transcript-panel';
import { MermaidChart } from '@/components/cards/chart-card';
import { ReferenceCard } from '@/components/cards/reference-card';
import { ContextCard } from '@/components/cards/context-card';
import { SummarySidebar } from '@/components/sidebar/summary-sidebar';
import { MicButton } from '@/components/controls/mic-button';

/* ─── Agent status badge ────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-amber-400',
  complete: 'bg-emerald-400',
  error: 'bg-red-400',
  idle: 'bg-slate-300',
};

/* ─── Section card wrapper ──────────────────────────── */
function SectionCard({
  title,
  icon,
  badge,
  children,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            {icon}
          </div>
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        </div>
        {badge}
      </div>
      {children}
    </motion.section>
  );
}

/* ─── Main layout ───────────────────────────────────── */
export function MainLayout() {
  const searchParams = useSearchParams();
  const urlSessionId = searchParams.get('session');

  const {
    transcriptChunks,
    interimText,
    charts,
    references,
    contextMatches,
    summaryBullets,
    isRecording,
    agentStatuses,
    sessionId,
    setSessionId,
  } = useEchoLensStore();

  // Sync session ID from URL or generate one on client mount
  useEffect(() => {
    if (urlSessionId) {
      if (urlSessionId !== sessionId) {
        setSessionId(urlSessionId);
      }
    } else if (!sessionId) {
      // No URL param and no session ID yet -> generate one
      setSessionId(`session-${Date.now()}`);
    }
  }, [urlSessionId, sessionId, setSessionId]);

  useEchoLensWs();

  // Compute real stats from store data
  const stats = useMemo(() => {
    const wordCount = transcriptChunks.reduce(
      (acc, c) => acc + c.text.split(/\s+/).filter(Boolean).length,
      0
    );
    return {
      words: wordCount,
      references: references.reduce((acc, r) => acc + r.sources.length, 0),
      charts: charts.length,
      highlights: summaryBullets.length,
      contexts: contextMatches.reduce((acc, c) => acc + c.matches.length, 0),
    };
  }, [transcriptChunks, references, charts, summaryBullets, contextMatches]);

  const activeAgents = Object.values(agentStatuses).filter(
    (s) => s === 'processing'
  ).length;

  return (
    <div className="flex h-screen flex-col bg-[#f8fafc] text-slate-900">
      {/* ─── Top bar ──────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900">EchoLens</h1>
            <p className="text-[11px] text-slate-400">AI Presentation Companion</p>
          </div>
        </div>

        {/* Center: Recording status */}
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 border border-red-200">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-600">Recording</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <div className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="text-xs font-medium text-slate-500">Idle</span>
            </div>
          )}

          {activeAgents > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 border border-amber-200">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-700">
                {activeAgents} agent{activeAgents > 1 ? 's' : ''} working
              </span>
            </div>
          )}
        </div>

        {/* Right: Agent dots + mic */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {Object.entries(agentStatuses).map(([agent, status]) => (
              <div key={agent} className="flex items-center gap-1.5" title={`${agent}: ${status}`}>
                <div
                  className={`h-2 w-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-300'} ${status === 'processing' ? 'animate-pulse' : ''
                    }`}
                />
                <span className="text-[11px] capitalize text-slate-500">{agent}</span>
              </div>
            ))}
          </div>
          <MicButton />
        </div>
      </header>

      {/* ─── Body — 3 columns ─────────────────────────── */}
      <div className="flex flex-1 gap-5 overflow-hidden p-5">
        {/* ─── LEFT: Session Highlights + Transcript ───── */}
        <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-hidden">
          {/* Summary sidebar */}
          <div className="flex-1 overflow-hidden">
            <SummarySidebar bullets={summaryBullets} />
          </div>

          {/* Transcript */}
          <div className="h-64 shrink-0">
            <TranscriptPanel chunks={transcriptChunks} interimText={interimText} />
          </div>
        </aside>

        {/* ─── CENTER: Content cards ───────────────────── */}
        <main className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
          {/* Meeting Overview card — generated from summary bullets */}
          <SectionCard
            title="Meeting Overview"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
            }
            badge={
              stats.highlights > 0 ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                  {stats.highlights} point{stats.highlights !== 1 ? 's' : ''}
                </span>
              ) : undefined
            }
          >
            {summaryBullets.length > 0 ? (
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {summaryBullets.slice(0, 8).map((bullet) => (
                    <OverviewBullet key={bullet.id} bullet={bullet} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                icon="📋"
                message="Key points, decisions, and action items will appear here as the meeting progresses."
              />
            )}
          </SectionCard>

          {/* Visual Insights card — Mermaid charts */}
          <SectionCard
            title="Visual Insights"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            }
            badge={
              stats.charts > 0 ? (
                <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-600">
                  {stats.charts} chart{stats.charts !== 1 ? 's' : ''}
                </span>
              ) : undefined
            }
          >
            {charts.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {charts.map((chart, i) => (
                    <MermaidChart
                      key={`chart-${i}`}
                      code={chart.mermaidCode}
                      id={`chart-${i}`}
                      title={chart.title}
                      narration={chart.narration}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                icon="📊"
                message="Infographics and charts will render here when data claims are detected in the conversation."
              />
            )}
          </SectionCard>

          {/* Referenced Articles card */}
          <SectionCard
            title="Referenced Articles"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }
            badge={
              stats.references > 0 ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                  {stats.references} source{stats.references !== 1 ? 's' : ''}
                </span>
              ) : undefined
            }
          >
            {references.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {references.map((ref, i) => (
                    <ReferenceCard key={`ref-${i}`} sources={ref.sources} query={ref.query} />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <EmptyState
                icon="🔗"
                message="Source references will appear here when external claims or citations are detected."
              />
            )}
          </SectionCard>

          {/* Context Matches card (Emails, Docs, Calendar, Slack) */}
          {contextMatches.length > 0 && (
            <SectionCard
              title="Related Context"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
              badge={
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">
                  {stats.contexts} match{stats.contexts !== 1 ? 'es' : ''}
                </span>
              }
            >
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {contextMatches.flatMap((ctx) =>
                    ctx.matches.map((match) => (
                      <ContextCard key={match.id} match={match} matchType={ctx.matchType} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </SectionCard>
          )}
        </main>

        {/* ─── RIGHT: Session info ─────────────────────── */}
        <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
          {/* Session Info card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-slate-800">Session Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Words" value={stats.words} icon="📝" />
              <StatTile label="Highlights" value={stats.highlights} icon="💡" />
              <StatTile label="Charts" value={stats.charts} icon="📊" />
              <StatTile label="References" value={stats.references} icon="🔗" />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Session</span>
                <span className="font-mono text-[11px] text-slate-400">
                  {sessionId ? `${sessionId.slice(0, 16)}…` : 'Initializing...'}
                </span>
              </div>
            </div>
          </div>

          {/* Agent Pipeline Status card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">Agent Pipeline</h3>
            <div className="space-y-2.5">
              {(['orchestrator', 'chart', 'reference', 'context', 'summary'] as const).map(
                (agent) => {
                  const status = agentStatuses[agent] ?? 'idle';
                  return (
                    <div key={agent} className="flex items-center justify-between">
                      <span className="text-xs capitalize text-slate-600">{agent}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${status === 'processing'
                          ? 'bg-amber-50 text-amber-700'
                          : status === 'complete'
                            ? 'bg-emerald-50 text-emerald-700'
                            : status === 'error'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-300'} ${status === 'processing' ? 'animate-pulse' : ''
                            }`}
                        />
                        {status}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* Quick Guide card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">How It Works</h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Click the mic button to start recording', color: 'bg-blue-500' },
                { step: '2', text: 'Speak naturally — AI analyzes in real-time', color: 'bg-violet-500' },
                { step: '3', text: 'Charts, references & summaries appear automatically', color: 'bg-emerald-500' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-2.5">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.color} text-[10px] font-bold text-white`}
                  >
                    {item.step}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────── */

const BULLET_CATEGORY_STYLES = {
  key_point: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: '●', label: 'Key Point' },
  decision: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✓', label: 'Decision' },
  action_item: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '⚑', label: 'Action' },
  question: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', icon: '?', label: 'Question' },
};

function OverviewBullet({
  bullet,
}: {
  bullet: {
    id: string;
    text: string;
    category: 'key_point' | 'decision' | 'action_item' | 'question';
    owner?: string;
  };
}) {
  const style = BULLET_CATEGORY_STYLES[bullet.category];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', duration: 0.35 }}
      className={`flex items-start gap-2.5 rounded-xl border ${style.border} ${style.bg} px-3.5 py-2.5`}
    >
      <span className={`mt-0.5 text-xs font-semibold ${style.color}`}>{style.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-relaxed text-slate-700">{bullet.text}</p>
        {bullet.owner && (
          <p className="mt-0.5 text-[11px] text-slate-400">Assigned: {bullet.owner}</p>
        )}
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${style.color} ${style.bg}`}>
        {style.label}
      </span>
    </motion.div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <span className="text-base">{icon}</span>
      <p className="mt-1 text-lg font-bold text-slate-800">{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="text-3xl opacity-40">{icon}</span>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-slate-400">{message}</p>
    </div>
  );
}
