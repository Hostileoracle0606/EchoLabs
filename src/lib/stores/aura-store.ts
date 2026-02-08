import { create } from 'zustand';
import type { AuraState, VisualizationCard } from '@/lib/types';

interface AuraStore {
    // State
    state: AuraState;
    audioLevel: number;
    currentVisualization: VisualizationCard | null;
    queuedVisualizations: VisualizationCard[];
    transitionProgress: number;

    // Actions
    setState: (state: AuraState) => void;
    setAudioLevel: (level: number) => void;
    startListening: () => void;
    stopListening: () => void;
    triggerVisualization: (card: VisualizationCard) => void;
    dismissVisualization: () => void;
    queueVisualization: (card: VisualizationCard) => void;
    nextVisualization: () => void;
    setTransitionProgress: (progress: number) => void;
    reset: () => void;
}

export const useAuraStore = create<AuraStore>((set, get) => ({
    // Initial state
    state: 'idle',
    audioLevel: 0,
    currentVisualization: null,
    queuedVisualizations: [],
    transitionProgress: 0,

    // Actions
    setState: (state) => set({ state }),

    setAudioLevel: (level) => set({ audioLevel: Math.max(0, Math.min(1, level)) }),

    startListening: () => {
        const { state } = get();
        if (state === 'idle') {
            set({ state: 'listening' });
        }
    },

    stopListening: () => {
        const { state } = get();
        if (state === 'listening') {
            set({ state: 'idle', audioLevel: 0 });
        }
    },

    triggerVisualization: (card) => {
        set({
            state: 'morphing',
            transitionProgress: 0,
        });

        // After morph animation completes, show visualization
        setTimeout(() => {
            set({
                state: 'visualizing',
                currentVisualization: card,
                transitionProgress: 1,
            });
        }, 800); // Match morph duration
    },

    dismissVisualization: () => {
        const { queuedVisualizations } = get();

        set({
            state: 'collapsing',
            transitionProgress: 0,
        });

        // After collapse animation
        setTimeout(() => {
            if (queuedVisualizations.length > 0) {
                // Show next queued visualization
                const [next, ...rest] = queuedVisualizations;
                set({
                    state: 'morphing',
                    queuedVisualizations: rest,
                });

                setTimeout(() => {
                    set({
                        state: 'visualizing',
                        currentVisualization: next,
                        transitionProgress: 1,
                    });
                }, 800);
            } else {
                // Return to listening state
                set({
                    state: 'listening',
                    currentVisualization: null,
                    transitionProgress: 0,
                });
            }
        }, 500); // Collapse duration
    },

    queueVisualization: (card) => {
        set((state) => ({
            queuedVisualizations: [...state.queuedVisualizations, card],
        }));
    },

    nextVisualization: () => {
        const { queuedVisualizations, state } = get();

        if (queuedVisualizations.length === 0) return;

        if (state === 'visualizing') {
            get().dismissVisualization();
        } else if (state === 'listening' || state === 'idle') {
            const [next, ...rest] = queuedVisualizations;
            set({ queuedVisualizations: rest });
            get().triggerVisualization(next);
        }
    },

    setTransitionProgress: (progress) => set({ transitionProgress: progress }),

    reset: () => set({
        state: 'idle',
        audioLevel: 0,
        currentVisualization: null,
        queuedVisualizations: [],
        transitionProgress: 0,
    }),
}));
