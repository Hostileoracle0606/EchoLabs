import type { SummaryBullet } from '@/types/agents';

const SIMILARITY_THRESHOLD = 0.6;

function getWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function wordOverlap(a: string, b: string): number {
  const wordsA = getWords(a);
  const wordsB = getWords(b);

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  const minSize = Math.min(wordsA.size, wordsB.size);
  return overlap / minSize;
}

function isDuplicate(bullet: SummaryBullet, existing: SummaryBullet[]): boolean {
  return existing.some(
    (e) => wordOverlap(bullet.text, e.text) >= SIMILARITY_THRESHOLD
  );
}

export function deduplicateBullets(
  incoming: SummaryBullet[],
  existing: SummaryBullet[]
): SummaryBullet[] {
  const result: SummaryBullet[] = [];
  const allExisting = [...existing];

  for (const bullet of incoming) {
    if (!isDuplicate(bullet, allExisting)) {
      result.push(bullet);
      allExisting.push(bullet); // Also dedup against newly added
    }
  }

  return result;
}
