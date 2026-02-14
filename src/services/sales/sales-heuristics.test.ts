import { describe, it, expect } from 'vitest';
import { detectObjections, detectBuyingSignals, detectNextSteps, inferStage } from './sales-heuristics';

describe('Sales heuristics', () => {
  it('detects pricing objections', () => {
    const objections = detectObjections('This is too expensive for us.', 'customer');
    expect(objections.length).toBeGreaterThan(0);
    expect(objections[0].type).toBe('price');
  });

  it('detects direct buying signals', () => {
    const signals = detectBuyingSignals('How do we get started?', 'customer');
    expect(signals.length).toBeGreaterThan(0);
    expect(signals[0].type).toBe('direct');
  });

  it('detects next steps', () => {
    const steps = detectNextSteps('Can we schedule a follow-up?');
    expect(steps.length).toBeGreaterThan(0);
  });

  it('infers stage from text', () => {
    const stage = inferStage('Let’s talk about your pain points.', 'opening');
    expect(stage).toBe('discovery');
  });
});
