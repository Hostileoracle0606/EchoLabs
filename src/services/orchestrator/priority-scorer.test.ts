import { describe, it, expect } from 'vitest';
import { scorePriorities } from './priority-scorer';
import type { ClassifiedIntent } from '@/types/intents';

function makeIntent(type: ClassifiedIntent['type'], confidence = 0.9): ClassifiedIntent {
  return { type, confidence, excerpt: 'test excerpt', priority: 0 };
}

describe('PriorityScorer', () => {
  it('assigns highest priority (9) to DATA_CLAIM', () => {
    const intents = [makeIntent('DATA_CLAIM')];
    const scored = scorePriorities(intents);
    expect(scored[0].priority).toBe(9);
  });

  it('assigns high priority (8) to ACTION_ITEM', () => {
    const intents = [makeIntent('ACTION_ITEM')];
    const scored = scorePriorities(intents);
    expect(scored[0].priority).toBe(8);
  });

  it('assigns medium priority (7) to REFERENCE and DECISION', () => {
    const intents = [makeIntent('REFERENCE'), makeIntent('DECISION')];
    const scored = scorePriorities(intents);
    expect(scored[0].priority).toBe(7);
    expect(scored[1].priority).toBe(7);
  });

  it('assigns priority 6 to KEY_POINT, EMAIL_MENTION, DOC_MENTION', () => {
    const intents = [
      makeIntent('KEY_POINT'),
      makeIntent('EMAIL_MENTION'),
      makeIntent('DOC_MENTION'),
    ];
    const scored = scorePriorities(intents);
    scored.forEach((intent) => {
      expect(intent.priority).toBe(6);
    });
  });

  it('assigns lowest priority (3) to TOPIC_SHIFT', () => {
    const intents = [makeIntent('TOPIC_SHIFT')];
    const scored = scorePriorities(intents);
    expect(scored[0].priority).toBe(3);
  });

  it('assigns priority 5 to QUESTION', () => {
    const intents = [makeIntent('QUESTION')];
    const scored = scorePriorities(intents);
    expect(scored[0].priority).toBe(5);
  });

  it('sorts intents by priority descending', () => {
    const intents = [
      makeIntent('TOPIC_SHIFT'),
      makeIntent('DATA_CLAIM'),
      makeIntent('KEY_POINT'),
    ];
    const scored = scorePriorities(intents);
    expect(scored[0].type).toBe('DATA_CLAIM');
    expect(scored[1].type).toBe('KEY_POINT');
    expect(scored[2].type).toBe('TOPIC_SHIFT');
  });

  it('handles empty intents array', () => {
    const scored = scorePriorities([]);
    expect(scored).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const original = [makeIntent('DATA_CLAIM')];
    const originalPriority = original[0].priority;
    scorePriorities(original);
    expect(original[0].priority).toBe(originalPriority);
  });
});
