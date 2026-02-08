import { describe, it, expect } from 'vitest';
import { deduplicateBullets } from './deduplicator';
import type { SummaryBullet } from '@/types/agents';

function bullet(text: string, category: SummaryBullet['category'] = 'key_point'): SummaryBullet {
  return {
    id: `bullet-${Math.random().toString(36).slice(2)}`,
    text,
    category,
    timestamp: Date.now(),
  };
}

describe('Deduplicator', () => {
  it('keeps unique bullets', () => {
    const existing = [bullet('Revenue grew 40% last quarter')];
    const incoming = [bullet('We decided to hire 5 more engineers')];

    const result = deduplicateBullets(incoming, existing);
    expect(result).toHaveLength(1);
    expect(result[0].text).toContain('hire 5 more engineers');
  });

  it('removes near-duplicate bullets', () => {
    const existing = [bullet('Revenue grew 40% last quarter driven by enterprise')];
    const incoming = [bullet('Revenue grew 40% last quarter enterprise segment')];

    const result = deduplicateBullets(incoming, existing);
    expect(result).toHaveLength(0);
  });

  it('keeps bullets that share some words but are different', () => {
    const existing = [bullet('Revenue grew 40% last quarter')];
    const incoming = [bullet('Revenue targets for next quarter are 50%')];

    const result = deduplicateBullets(incoming, existing);
    expect(result).toHaveLength(1);
  });

  it('handles empty existing bullets', () => {
    const incoming = [bullet('Revenue grew 40% last quarter'), bullet('We decided to hire five engineers')];
    const result = deduplicateBullets(incoming, []);
    expect(result).toHaveLength(2);
  });

  it('handles empty incoming bullets', () => {
    const existing = [bullet('Existing point')];
    const result = deduplicateBullets([], existing);
    expect(result).toHaveLength(0);
  });

  it('deduplicates within incoming array itself', () => {
    const incoming = [
      bullet('Revenue grew 40% last quarter'),
      bullet('Revenue grew 40% in the last quarter'),
    ];
    const result = deduplicateBullets(incoming, []);
    expect(result).toHaveLength(1);
  });
});
