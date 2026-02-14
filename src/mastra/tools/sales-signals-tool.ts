import type { ToolDefinition } from '../types';
import { detectBuyingSignals, detectObjections } from '@/services/sales/sales-heuristics';

export const detectBuyingSignalsTool: ToolDefinition<{ transcript: string }, { signals: string[] }> = {
  id: 'detect-buying-signals',
  description: 'Detect buying signals in customer speech',
  execute: async (input) => {
    const signals = detectBuyingSignals(input.transcript, 'customer');
    return { signals: signals.map((signal) => signal.type) };
  },
};

export const detectObjectionTool: ToolDefinition<{ transcript: string }, { detected: boolean; type?: string }> = {
  id: 'detect-objection',
  description: 'Detect and classify objections in customer speech',
  execute: async (input) => {
    const objections = detectObjections(input.transcript, 'customer');
    if (objections.length === 0) {
      return { detected: false };
    }
    return { detected: true, type: objections[0].type };
  },
};
