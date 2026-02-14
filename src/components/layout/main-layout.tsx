'use client';

import { useEffect, useState } from 'react';
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
import { AuraHero } from '@/components/aura';

/* ─── Agent status badge ────────────────────────────── */
const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-amber-400',
  complete: 'bg-emerald-400',
  error: 'bg-red-400',
  idle: 'bg-slate-300',
};


/* ─── Carousel Card Component ───────────────────────── */
function CarouselCard<T>({
  title,
  icon,
  items,
  renderItem,
  emptyState,
  className = '',
}: {
  title: string;
  icon: React.ReactNode;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState: React.ReactNode;
  className?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index when items change length to avoid out–of–bounds, 
  // but try to keep position if possible or go to last
  useEffect(() => {
    if (items.length === 0) {
      setCurrentIndex(0);
    } else if (currentIndex >= items.length) {
      setCurrentIndex(items.length - 1);
    }
  }, [items.length]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className={`flex flex-col rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--foreground-muted)]">
            {icon}
          </div>
          <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
        </div>
        {items.length > 0 && (
          <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">
            {currentIndex + 1} / {items.length}
          </span>
        )}
      </div>

      <div className="flex-1 relative min-h-[120px] flex flex-col">
        {items.length > 0 ? (
          <>
            <div className="flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {renderItem(items[currentIndex], currentIndex)}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls */}
            {items.length > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-[var(--glass-border)] pt-3">
                <button
                  onClick={goToPrev}
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--foreground-muted)] transition-colors"
                  aria-label="Previous"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="flex gap-1.5">
                  {items.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex
                        ? 'bg-[var(--accent-primary)] w-3'
                        : 'bg-[var(--foreground-subtle)] hover:bg-[var(--foreground-muted)]'
                        }`}
                      aria-label={`Go to item ${idx + 1}`}
                    />
                  ))}
                </div>

                <button
                  onClick={goToNext}
                  className="p-1 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--foreground-muted)] transition-colors"
                  aria-label="Next"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          emptyState
        )}
      </div>
    </motion.section>
  );
}
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
    <div className="relative flex h-screen flex-col bg-[var(--bg-primary)] text-[var(--foreground)] overflow-hidden">
      {/* Background Aura */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <AuraHero />
      </div>

      {/* ─── Top bar ──────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between glass border-b border-[var(--glass-border)] px-6 py-3">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-lg">E</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[var(--foreground)]">EchoLens</h1>
            <p className="text-[11px] text-[var(--foreground-muted)]">AI Presentation Companion</p>
          </div>
        </div>

        {/* Center: Recording status */}
        <div className="flex items-center gap-3">
          {isRecording ? (
            <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 border border-red-500/20">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">Recording</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full glass px-3 py-1.5 border border-[var(--glass-border)]">
              <div className="h-2 w-2 rounded-full bg-[var(--foreground-subtle)]" />
              <span className="text-xs font-medium text-[var(--foreground-muted)]">Idle</span>
            </div>
          )}

          {activeAgents > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 border border-amber-500/20">
              <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              <span className="text-xs font-medium text-amber-500">
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
                  className={`h-2 w-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-700'} ${status === 'processing' ? 'animate-pulse' : ''
                    }`}
                />
                <span className="text-[11px] capitalize text-[var(--foreground-muted)]">{agent}</span>
              </div>
            ))}
          </div>
          <MicButton />
        </div>
      </header>

      {/* ─── Body — 3 columns ─────────────────────────── */}
      <div className="relative z-10 flex flex-1 gap-5 overflow-hidden p-5">
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
          {/* Meeting Overview card — generated from summary bullets */}
          <CarouselCard
            title="Meeting Overview"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
              </svg>
            }
            items={summaryBullets}
            renderItem={(bullet) => <OverviewBullet key={bullet.id} bullet={bullet} />}
            emptyState={
              <EmptyState
                icon="📋"
                message="Key points, decisions, and action items will appear here as the meeting progresses."
              />
            }
          />

          {/* Visual Insights card — Mermaid charts */}
          {/* Visual Insights card — Mermaid charts */}
          <CarouselCard
            title="Visual Insights"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18M9 21V9" />
              </svg>
            }
            items={charts}
            renderItem={(chart, i) => (
              <MermaidChart
                key={`chart-${i}`}
                code={chart.mermaidCode}
                id={`chart-${i}`}
                title={chart.title}
                narration={chart.narration}
              />
            )}
            emptyState={
              <EmptyState
                icon="📊"
                message="Infographics and charts will render here when data claims are detected in the conversation."
              />
            }
          />

          {/* Referenced Articles card */}
          {/* Referenced Articles card */}
          <CarouselCard
            title="Referenced Articles"
            icon={
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }
            items={references}
            renderItem={(ref, i) => (
              <ReferenceCard key={`ref-${i}`} sources={ref.sources} query={ref.query} />
            )}
            emptyState={
              <EmptyState
                icon="🔗"
                message="Source references will appear here when external claims or citations are detected."
              />
            }
          />

          {/* Context Matches card (Emails, Docs, Calendar, Slack) */}
          {contextMatches.length > 0 && (
            <CarouselCard
              title="Related Context"
              icon={
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
              items={contextMatches.flatMap((ctx) =>
                ctx.matches.map((match) => ({ match, matchType: ctx.matchType }))
              )}
              renderItem={(item) => (
                <ContextCard key={item.match.id} match={item.match} matchType={item.matchType} />
              )}
              emptyState={null} // Should not happen given outer check, but satisfy type
            />
          )}
        </main>

        {/* ─── RIGHT: Session info ─────────────────────── */}
        <aside className="relative z-10 flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
          {/* Session Info card */}
          <div className="rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Session Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Words" value={stats.words} icon="📝" />
              <StatTile label="Highlights" value={stats.highlights} icon="💡" />
              <StatTile label="Charts" value={stats.charts} icon="📊" />
              <StatTile label="References" value={stats.references} icon="🔗" />
            </div>
            <div className="mt-4 border-t border-[var(--glass-border)] pt-3">
              <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>Session</span>
                <span className="font-mono text-[11px] text-[var(--foreground-subtle)]">
                  {sessionId ? `${sessionId.slice(0, 16)}…` : 'Initializing...'}
                </span>
              </div>
            </div>
          </div>

          {/* Agent Pipeline Status card */}
          <div className="rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Agent Pipeline</h3>
            <div className="space-y-2.5">
              {(['orchestrator', 'chart', 'reference', 'context', 'summary'] as const).map(
                (agent) => {
                  const status = agentStatuses[agent] ?? 'idle';
                  return (
                    <div key={agent} className="flex items-center justify-between">
                      <span className="text-xs capitalize text-[var(--foreground-muted)]">{agent}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${status === 'processing'
                          ? 'bg-amber-500/10 text-amber-500'
                          : status === 'complete'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : status === 'error'
                              ? 'bg-red-500/10 text-red-500'
                              : 'bg-[var(--bg-secondary)] text-[var(--foreground-muted)]'
                          }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-700'} ${status === 'processing' ? 'animate-pulse' : ''
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
          <div className="rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">How It Works</h3>
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
                  <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">{item.text}</p>
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
  key_point: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '●', label: 'Key Point' },
  decision: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '✓', label: 'Decision' },
  action_item: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '⚑', label: 'Action' },
  question: { color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: '?', label: 'Question' },
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
        <p className="text-[13px] leading-relaxed text-[var(--foreground)]">{bullet.text}</p>
        {bullet.owner && (
          <p className="mt-0.5 text-[11px] text-[var(--foreground-subtle)]">Assigned: {bullet.owner}</p>
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
    <div className="rounded-xl bg-[var(--bg-secondary)] p-3 text-center">
      <span className="text-base">{icon}</span>
      <p className="mt-1 text-lg font-bold text-[var(--foreground)]">{value}</p>
      <p className="text-[11px] text-[var(--foreground-muted)]">{label}</p>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="text-3xl opacity-40 grayscale">{icon}</span>
      <p className="mt-2 max-w-xs text-xs leading-relaxed text-[var(--foreground-subtle)]">{message}</p>
    </div>
  );
}
