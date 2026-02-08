'use client';

import { AnimatePresence } from 'motion/react';
import { useEchoLensStore } from '@/store/echolens-store';
import { useEchoLensWs } from '@/hooks/use-echolens-ws';
import { TranscriptPanel } from '@/components/transcript/transcript-panel';
import { MermaidChart } from '@/components/cards/chart-card';
import { ReferenceCard } from '@/components/cards/reference-card';
import { ContextCard } from '@/components/cards/context-card';
import { SummarySidebar } from '@/components/sidebar/summary-sidebar';
import { MicButton } from '@/components/controls/mic-button';

export function MainLayout() {
  // Initialize WebSocket connection
  useEchoLensWs();

  const {
    transcriptChunks,
    interimText,
    charts,
    references,
    contextMatches,
    summaryBullets,
    isRecording,
    agentStatuses,
  } = useEchoLensStore();

  return (
    <div className="flex h-screen flex-col bg-[#0a0a12] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#00e5a0] to-[#5b8def] flex items-center justify-center">
            <span className="text-xs font-bold text-[#0a0a12]">EL</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">EchoLens</h1>
          <span className="text-xs text-white/30">AI Presentation Companion</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Agent status indicators */}
          <div className="flex gap-2">
            {Object.entries(agentStatuses).map(([agent, status]) => (
              <div
                key={agent}
                className={`h-2 w-2 rounded-full ${
                  status === 'processing'
                    ? 'animate-pulse bg-yellow-400'
                    : status === 'complete'
                    ? 'bg-green-400'
                    : status === 'error'
                    ? 'bg-red-400'
                    : 'bg-white/20'
                }`}
                title={`${agent}: ${status}`}
              />
            ))}
          </div>

          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs text-red-400">Recording</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content — 3 columns */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left: Summary sidebar */}
        <div className="w-72 shrink-0">
          <SummarySidebar bullets={summaryBullets} />
        </div>

        {/* Center: Transcript + Cards */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* Cards area */}
          <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '50%' }}>
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

            <AnimatePresence mode="popLayout">
              {references.map((ref, i) => (
                <ReferenceCard
                  key={`ref-${i}`}
                  sources={ref.sources}
                  query={ref.query}
                />
              ))}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {contextMatches.flatMap((ctx) =>
                ctx.matches.map((match) => (
                  <ContextCard key={match.id} match={match} matchType={ctx.matchType} />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Transcript */}
          <TranscriptPanel chunks={transcriptChunks} interimText={interimText} />
        </div>

        {/* Right: Controls */}
        <div className="flex w-24 shrink-0 flex-col items-center justify-center gap-4">
          <MicButton />
          <p className="text-[10px] text-white/30 text-center">
            {isRecording ? 'Click to stop' : 'Click to start'}
          </p>
        </div>
      </div>
    </div>
  );
}
