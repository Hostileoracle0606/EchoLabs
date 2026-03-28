import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ChartPayload, ReferencePayload, ContextPayload } from '@/types/events';
import type { BuyingSignal, CallSummary, CoachingTip, ComplianceWarning, NextStep, Objection, SalesStage } from '@/types/sales';
import type { TranscriptSpeaker } from '@/types/transcript';
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
  speaker: TranscriptSpeaker;
  speakerId?: number;
  timestamp: number;
}

interface MomentumState {
  // Session
  sessionId: string;
  callId: string;
  isRecording: boolean;

  // Audio levels (for 3D aural blob)
  audioLevels: AudioLevels;

  // Transcript
  transcriptChunks: TranscriptChunkDisplay[];
  interimText: string;

  // Agent results
  charts: ChartPayload[];
  references: ReferencePayload[];
  contextMatches: ContextPayload[];
  summaryBullets: SummaryBulletDisplay[];

  // Sales insights
  salesStage: SalesStage;
  objections: Objection[];
  buyingSignals: BuyingSignal[];
  nextSteps: NextStep[];
  coachingTips: CoachingTip[];
  complianceWarnings: ComplianceWarning[];
  callSummary: CallSummary | null;

  // Agent status
  agentStatuses: Record<string, 'idle' | 'processing' | 'complete' | 'error'>;

  // Actions
  setSessionId: (id: string) => void;
  setCallId: (id: string) => void;
  setRecording: (recording: boolean) => void;
  addTranscriptChunk: (
    text: string,
    isFinal: boolean,
    speaker?: TranscriptSpeaker,
    timestamp?: number,
    speakerId?: number
  ) => void;
  setAudioLevels: (levels: AudioLevels) => void;
  setInterimText: (text: string) => void;
  addChart: (chart: ChartPayload) => void;
  addReferences: (refs: ReferencePayload) => void;
  addContextMatch: (match: ContextPayload) => void;
  updateSummary: (bullets: SummaryBulletDisplay[]) => void;
  setSalesStage: (stage: SalesStage) => void;
  addObjections: (objections: Objection[]) => void;
  addBuyingSignals: (signals: BuyingSignal[]) => void;
  addNextSteps: (steps: NextStep[]) => void;
  addCoachingTips: (tips: CoachingTip[]) => void;
  addComplianceWarnings: (warnings: ComplianceWarning[]) => void;
  setCallSummary: (summary: CallSummary) => void;
  setAgentStatus: (agent: string, status: 'idle' | 'processing' | 'complete' | 'error') => void;
  reset: () => void;
}

export const useMomentumStore = create<MomentumState>()(
  immer((set) => ({
    sessionId: '', // Initialize empty to avoid hydration mismatch
    callId: '',
    isRecording: false,
    audioLevels: { bass: 0, mid: 0, treble: 0, amplitude: 0 },
    transcriptChunks: [],
    interimText: '',
    charts: [],
    references: [],
    contextMatches: [],
    summaryBullets: [],
    salesStage: 'opening',
    objections: [],
    buyingSignals: [],
    nextSteps: [],
    coachingTips: [],
    complianceWarnings: [],
    callSummary: null,
    agentStatuses: {},

    setRecording: (recording) =>
      set((state) => {
        state.isRecording = recording;
      }),

    setAudioLevels: (levels) =>
      set((state) => {
        state.audioLevels = levels;
      }),

    addTranscriptChunk: (text, isFinal, speaker = 'customer', timestamp = Date.now(), speakerId) =>
      set((state) => {
        if (isFinal) {
          state.transcriptChunks.push({
            id: `chunk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text,
            isFinal: true,
            speaker,
            speakerId,
            timestamp,
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
        const existingIndex = state.charts.findIndex((c) => c.id && c.id === chart.id);
        if (existingIndex !== -1) {
          state.charts[existingIndex] = chart;
        } else {
          state.charts.unshift(chart); // Most recent first
          if (state.charts.length > 10) state.charts.pop(); // Keep max 10
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

    setSalesStage: (stage) =>
      set((state) => {
        state.salesStage = stage;
      }),

    addObjections: (objections) =>
      set((state) => {
        state.objections.push(...objections);
      }),

    addBuyingSignals: (signals) =>
      set((state) => {
        state.buyingSignals.push(...signals);
      }),

    addNextSteps: (steps) =>
      set((state) => {
        state.nextSteps.push(...steps);
      }),

    addCoachingTips: (tips) =>
      set((state) => {
        state.coachingTips.push(...tips);
      }),

    addComplianceWarnings: (warnings) =>
      set((state) => {
        state.complianceWarnings.push(...warnings);
      }),

    setCallSummary: (summary) =>
      set((state) => {
        state.callSummary = summary;
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
        state.salesStage = 'opening';
        state.objections = [];
        state.buyingSignals = [];
        state.nextSteps = [];
        state.coachingTips = [];
        state.complianceWarnings = [];
        state.callSummary = null;
        state.agentStatuses = {};
        state.isRecording = false;
        state.audioLevels = { bass: 0, mid: 0, treble: 0, amplitude: 0 };
      }),

    setSessionId: (id: string) =>
      set((state) => {
        state.sessionId = id;
      }),

    setCallId: (id: string) =>
      set((state) => {
        state.callId = id;
      }),
  }))
);
