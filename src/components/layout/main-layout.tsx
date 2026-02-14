'use client';

import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { useMomentumStore } from '@/store/momentum-store';
import { useMomentumWs } from '@/hooks/use-momentum-ws';
import { TranscriptPanel } from '@/components/transcript/transcript-panel';
import { MicButton } from '@/components/controls/mic-button';
import { AuraHero } from '@/components/aura';
import type { BuyingSignal, CoachingTip, ComplianceWarning, NextStep, Objection } from '@/types/sales';

const STATUS_COLORS: Record<string, string> = {
  processing: 'bg-amber-400',
  complete: 'bg-emerald-400',
  error: 'bg-red-400',
  idle: 'bg-slate-300',
};

function InsightCard<T>({
  title,
  icon,
  items,
  emptyState,
  renderItem,
}: {
  title: string;
  icon: ReactNode;
  items: T[];
  emptyState: React.ReactNode;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="flex flex-col rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-[var(--foreground-muted)]">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      </div>
      <div className="flex-1 space-y-2">
        {items.length === 0 ? emptyState : items.map(renderItem)}
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
    isRecording,
    agentStatuses,
    sessionId,
    callId,
    salesStage,
    objections,
    buyingSignals,
    nextSteps,
    coachingTips,
    complianceWarnings,
    callSummary,
    setSessionId,
    setCallId,
  } = useMomentumStore();

  useEffect(() => {
    if (urlSessionId) {
      if (urlSessionId !== sessionId) {
        setSessionId(urlSessionId);
        setCallId(`call-${urlSessionId}`);
      }
    } else if (!sessionId) {
      const generated = `session-${Date.now()}`;
      setSessionId(generated);
      setCallId(`call-${generated}`);
    }
  }, [urlSessionId, sessionId, setSessionId, setCallId]);

  useMomentumWs();

  const stats = useMemo(() => {
    const wordCount = transcriptChunks.reduce(
      (acc, c) => acc + c.text.split(/\s+/).filter(Boolean).length,
      0
    );
    return {
      words: wordCount,
      objections: objections.length,
      signals: buyingSignals.length,
      steps: nextSteps.length,
      warnings: complianceWarnings.length,
    };
  }, [transcriptChunks, objections, buyingSignals, nextSteps, complianceWarnings]);

  const activeAgents = Object.values(agentStatuses).filter(
    (s) => s === 'processing'
  ).length;

  return (
    <div className="relative flex h-screen flex-col bg-[var(--bg-primary)] text-[var(--foreground)] overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <AuraHero />
      </div>

      <header className="relative z-10 flex items-center justify-between glass border-b border-[var(--glass-border)] px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-md shadow-blue-500/20">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-[var(--foreground)]">
              Momentum Sales Advisor
            </h1>
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Live coaching for revenue conversations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[var(--bg-secondary)] px-3 py-1.5 border border-[var(--glass-border)]">
            <span className="text-xs font-medium text-[var(--foreground-muted)]">Stage</span>
            <span className="text-xs font-semibold text-[var(--foreground)] capitalize">
              {salesStage.replace('_', ' ')}
            </span>
          </div>
          {isRecording ? (
            <div className="flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 border border-red-500/20">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-400">Live</span>
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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {Object.entries(agentStatuses).map(([agent, status]) => (
              <div key={agent} className="flex items-center gap-1.5" title={`${agent}: ${status}`}>
                <div
                  className={`h-2 w-2 rounded-full ${STATUS_COLORS[status] ?? 'bg-slate-700'} ${
                    status === 'processing' ? 'animate-pulse' : ''
                  }`}
                />
                <span className="text-[11px] capitalize text-[var(--foreground-muted)]">{agent}</span>
              </div>
            ))}
          </div>
          <MicButton />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 gap-5 overflow-hidden p-5">
        <aside className="flex w-96 shrink-0 flex-col gap-4 overflow-hidden">
          <TranscriptPanel chunks={transcriptChunks} interimText={interimText} />

          <div className="rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Call Summary</h3>
            {callSummary ? (
              <div className="space-y-2 text-sm text-[var(--foreground)]">
                <p className="text-[13px] text-[var(--foreground-muted)]">{callSummary.recap}</p>
                {callSummary.actionItems.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--foreground-subtle)]">
                      Action Items
                    </p>
                    <ul className="mt-1 space-y-1 text-[13px]">
                      {callSummary.actionItems.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {callSummary.objections.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-[var(--foreground-subtle)]">
                      Objections
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {callSummary.objections.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-400"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--foreground-subtle)]">
                Call recap and action items will appear here as the conversation progresses.
              </p>
            )}
          </div>
        </aside>

        <main className="flex flex-1 flex-col gap-5 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <InsightCard
              title="Objections"
              icon={<span className="text-sm">⚠️</span>}
              items={objections}
              emptyState={<EmptyState icon="🧩" message="No objections detected yet." />}
              renderItem={(item) => <ObjectionItem key={item.id} item={item} />}
            />

            <InsightCard
              title="Buying Signals"
              icon={<span className="text-sm">✨</span>}
              items={buyingSignals}
              emptyState={<EmptyState icon="🧭" message="Listening for buying signals..." />}
              renderItem={(item) => <SignalItem key={item.id} item={item} />}
            />

            <InsightCard
              title="Next Steps"
              icon={<span className="text-sm">✅</span>}
              items={nextSteps}
              emptyState={<EmptyState icon="🗓️" message="Recommended next steps will show here." />}
              renderItem={(item) => <NextStepItem key={item.id} item={item} />}
            />

            <InsightCard
              title="Coaching Tips"
              icon={<span className="text-sm">🎧</span>}
              items={coachingTips}
              emptyState={<EmptyState icon="🎯" message="Live coaching tips will appear in the moment." />}
              renderItem={(item) => <CoachingItem key={item.id} item={item} />}
            />
          </div>
        </main>

        <aside className="relative z-10 flex w-72 shrink-0 flex-col gap-4 overflow-y-auto">
          <div className="rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Session Info</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatTile label="Words" value={stats.words} icon="📝" />
              <StatTile label="Signals" value={stats.signals} icon="✨" />
              <StatTile label="Objections" value={stats.objections} icon="⚠️" />
              <StatTile label="Warnings" value={stats.warnings} icon="🛡️" />
            </div>
            <div className="mt-4 border-t border-[var(--glass-border)] pt-3">
              <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>Session</span>
                <span className="font-mono text-[11px] text-[var(--foreground-subtle)]">
                  {sessionId ? `${sessionId.slice(0, 16)}…` : 'Initializing...'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span>Call</span>
                <span className="font-mono text-[11px] text-[var(--foreground-subtle)]">
                  {callId ? `${callId.slice(0, 16)}…` : 'Pending...'}
                </span>
              </div>
            </div>
          </div>

          <InsightCard
            title="Compliance"
            icon={<span className="text-sm">🛡️</span>}
            items={complianceWarnings}
            emptyState={<EmptyState icon="🧘" message="No compliance warnings detected." />}
            renderItem={(item) => <ComplianceItem key={item.id} item={item} />}
          />

          <div className="rounded-3xl border border-[var(--glass-border)] glass-card p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">How It Works</h3>
            <div className="space-y-3">
              {[
                { step: '1', text: 'Start the call to stream audio to Smallest.ai', color: 'bg-blue-500' },
                { step: '2', text: 'Mastra agents analyze signals and objections live', color: 'bg-violet-500' },
                { step: '3', text: 'Next steps and compliance alerts update in real time', color: 'bg-emerald-500' },
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

function ObjectionItem({ item }: { item: Objection }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.35 }}
      className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase text-red-400">{item.type}</span>
        <span className="text-[10px] text-[var(--foreground-subtle)]">{item.severity}</span>
      </div>
      <p className="mt-1 text-[13px] text-[var(--foreground)]">{item.text}</p>
    </motion.div>
  );
}

function SignalItem({ item }: { item: BuyingSignal }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.35 }}
      className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase text-emerald-500">{item.type}</span>
        <span className="text-[10px] text-[var(--foreground-subtle)]">Score {item.score}</span>
      </div>
      <p className="mt-1 text-[13px] text-[var(--foreground)]">{item.text}</p>
    </motion.div>
  );
}

function NextStepItem({ item }: { item: NextStep }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.35 }}
      className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2"
    >
      <p className="text-[13px] text-[var(--foreground)]">{item.text}</p>
      {item.owner && (
        <p className="mt-1 text-[10px] text-[var(--foreground-subtle)]">Owner: {item.owner}</p>
      )}
    </motion.div>
  );
}

function CoachingItem({ item }: { item: CoachingTip }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.35 }}
      className="rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2"
    >
      <p className="text-[11px] uppercase text-violet-400">{item.category}</p>
      <p className="mt-1 text-[13px] text-[var(--foreground)]">{item.title}</p>
      <p className="mt-1 text-[12px] text-[var(--foreground-muted)]">{item.detail}</p>
    </motion.div>
  );
}

function ComplianceItem({ item }: { item: ComplianceWarning }) {
  const severityColor =
    item.severity === 'critical' ? 'text-red-500' : item.severity === 'warning' ? 'text-amber-400' : 'text-blue-400';
  const severityBg =
    item.severity === 'critical' ? 'bg-red-500/10 border-red-500/20' : item.severity === 'warning'
      ? 'bg-amber-500/10 border-amber-500/20' : 'bg-blue-500/10 border-blue-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', duration: 0.35 }}
      className={`rounded-xl border px-3 py-2 ${severityBg}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-[11px] uppercase ${severityColor}`}>{item.severity}</span>
        <span className="text-[10px] text-[var(--foreground-subtle)]">{item.ruleId}</span>
      </div>
      <p className="mt-1 text-[13px] text-[var(--foreground)]">{item.text}</p>
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
