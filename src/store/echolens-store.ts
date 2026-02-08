import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChartPayload, ReferencePayload, ContextPayload } from '@/types/events';

interface SummaryBulletDisplay {
  id: string;
  text: string;
  category: 'key_point' | 'decision' | 'action_item' | 'question';
  owner?: string;
  timestamp: number;
  isNew: boolean;
}

interface TranscriptChunkDisplay {
  id: string;
  text: string;
  isFinal: boolean;
}

interface EchoLensState {
  // Session
  sessionId: string;
  isRecording: boolean;

  // Transcript
  transcriptChunks: TranscriptChunkDisplay[];
  interimText: string;

  // Agent results
  charts: ChartPayload[];
  references: ReferencePayload[];
  contextMatches: ContextPayload[];
  summaryBullets: SummaryBulletDisplay[];

  // Agent status
  agentStatuses: Record<string, 'idle' | 'processing' | 'complete' | 'error'>;

  // Actions
  setSessionId: (id: string) => void;
  setRecording: (recording: boolean) => void;
  addTranscriptChunk: (text: string, isFinal: boolean) => void;
  setInterimText: (text: string) => void;
  addChart: (chart: ChartPayload) => void;
  addReferences: (refs: ReferencePayload) => void;
  addContextMatch: (match: ContextPayload) => void;
  updateSummary: (bullets: SummaryBulletDisplay[]) => void;
  setAgentStatus: (agent: string, status: 'idle' | 'processing' | 'complete' | 'error') => void;
  reset: () => void;
}

export const useEchoLensStore = create<EchoLensState>()(
  immer((set) => ({
    sessionId: '', // Initialize empty to avoid hydration mismatch
    isRecording: false,
    transcriptChunks: [],
    interimText: '',
    charts: [],
    references: [],
    contextMatches: [],
    summaryBullets: [],
    agentStatuses: {},

    setRecording: (recording) =>
      set((state) => {
        state.isRecording = recording;
      }),

    addTranscriptChunk: (text, isFinal) =>
      set((state) => {
        if (isFinal) {
          state.transcriptChunks.push({
            id: `chunk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text,
            isFinal: true,
          });
          state.interimText = '';
        }
      }),

    setInterimText: (text) =>
      set((state) => {
        state.interimText = text;
      }),

    addChart: (chart) =>
      set((state) => {
        state.charts.unshift(chart); // Most recent first
        if (state.charts.length > 10) state.charts.pop(); // Keep max 10
      }),

    addReferences: (refs) =>
      set((state) => {
        state.references.unshift(refs);
        if (state.references.length > 5) state.references.pop();
      }),

    addContextMatch: (match) =>
      set((state) => {
        state.contextMatches.unshift(match);
        if (state.contextMatches.length > 5) state.contextMatches.pop();
      }),

    updateSummary: (bullets) =>
      set((state) => {
        state.summaryBullets = bullets;
      }),

    setAgentStatus: (agent, status) =>
      set((state) => {
        state.agentStatuses[agent] = status;
      }),

    reset: () =>
      set((state) => {
        state.transcriptChunks = [];
        state.interimText = '';
        state.charts = [];
        state.references = [];
        state.contextMatches = [];
        state.summaryBullets = [];
        state.agentStatuses = {};
        state.agentStatuses = {};
        state.isRecording = false;
      }),

    setSessionId: (id: string) =>
      set((state) => {
        state.sessionId = id;
      }),
  }))
);
