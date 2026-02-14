import { describe, it, expect } from 'vitest';
import { processTranscript } from './orchestrator.service';

describe('Sales Orchestrator', () => {
  it('returns stage updates and signal counts', async () => {
    const result = await processTranscript({
      text: 'We should schedule a follow-up next week. How do we get started?',
      timestamp: Date.now(),
      sessionId: 'test-session',
    });

    expect(result.stage).toBeDefined();
    expect(result.buyingSignals).toBeGreaterThanOrEqual(1);
    expect(result.nextSteps).toBeGreaterThanOrEqual(1);
  });

  it('detects pricing objections', async () => {
    const result = await processTranscript({
      text: 'This feels too expensive for our budget.',
      timestamp: Date.now(),
      sessionId: 'test-session-2',
    });

    expect(result.objections).toBeGreaterThanOrEqual(1);
  });
});
