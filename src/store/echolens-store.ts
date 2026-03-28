import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChartPayload, ReferencePayload, ContextPayload } from '@/types/events';
import type { AudioLevels } from '@/hooks/use-audio-analyser';

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
  sessionId: string;
  isRecording: boolean;
  audioLevels: AudioLevels;
  transcriptChunks: TranscriptChunkDisplay[];
  interimText: string;
  charts: ChartPayload[];
  references: ReferencePayload[];
  contextMatches: ContextPayload[];
  summaryBullets: SummaryBulletDisplay[];
  agentStatuses: Record<string, 'idle' | 'processing' | 'complete' | 'error'>;
  setSessionId: (id: string) => void;
  setRecording: (recording: boolean) => void;
  setAudioLevels: (levels: AudioLevels) => void;
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
    sessionId: '',
    isRecording: false,
    audioLevels: { bass: 0, mid: 0, treble: 0, amplitude: 0 },
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

    setAudioLevels: (levels) =>
      set((state) => {
        state.audioLevels = levels;
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
        const existingIndex = state.charts.findIndex((candidate) => candidate.id && candidate.id === chart.id);
        if (existingIndex !== -1) {
          state.charts[existingIndex] = chart;
        } else {
          state.charts.unshift(chart);
          if (state.charts.length > 10) state.charts.pop();
        }
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
        state.isRecording = false;
        state.audioLevels = { bass: 0, mid: 0, treble: 0, amplitude: 0 };
      }),

    setSessionId: (id) =>
      set((state) => {
        state.sessionId = id;
      }),
  }))
);
