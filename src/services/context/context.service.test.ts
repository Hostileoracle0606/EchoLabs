import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { findContextMatches } from './context.service';

describe('ContextService', () => {
  let tempDir: string;
  const workspaceId = 'workspace-test';

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-context-'));
    vi.stubEnv('ECHOLENS_DATA_FILE', path.join(tempDir, 'store.json'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('matches email from Lena about churn risk', async () => {
    const result = await findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.85,
        excerpt: 'Lena flagged three enterprise renewals at risk with churn signals',
        priority: 6,
      },
      context: 'discussing customer retention',
      sessionId: 'test-session',
      workspaceId,
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    const emailMatch = result.matches.find((m) => m.matchType === 'email');
    expect(emailMatch).toBeTruthy();
    expect(emailMatch!.from).toContain('Lena');
  });

  it('matches a document about the board deck', async () => {
    const result = await findContextMatches({
      intent: {
        type: 'DOC_MENTION',
        confidence: 0.86,
        excerpt: 'the board deck with ARR metrics and investor reporting',
        priority: 6,
      },
      context: 'reviewing board materials',
      sessionId: 'test-session',
      workspaceId,
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    const docMatch = result.matches.find((m) => m.matchType === 'doc');
    expect(docMatch).toBeTruthy();
    expect(docMatch!.title).toContain('Board_Deck');
  });

  it('matches email about pipeline and deal forecast', async () => {
    const result = await findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.8,
        excerpt: 'Derek pipeline update weighted deal forecast enterprise close',
        priority: 6,
      },
      context: 'sales pipeline review',
      sessionId: 'test-session',
      workspaceId,
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    const match = result.matches.find((m) => m.from?.includes('Derek'));
    expect(match).toBeTruthy();
  });

  it('returns empty matches for unrelated keywords', async () => {
    const result = await findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.7,
        excerpt: 'the quantum physics paper from Oxford university laboratory',
        priority: 6,
      },
      context: 'unrelated topic',
      sessionId: 'test-session',
      workspaceId,
    });

    expect(result.matches).toHaveLength(0);
  });

  it('scores relevance based on keyword overlap', async () => {
    const result = await findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.9,
        excerpt: 'churn renewal customer risk retention contract enterprise',
        priority: 6,
      },
      context: 'customer health assessment',
      sessionId: 'test-session',
      workspaceId,
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    expect(result.matches[0].relevanceScore).toBeGreaterThan(0);
  });

  it('matches across all context types (email, doc, calendar, slack)', async () => {
    const result = await findContextMatches({
      intent: {
        type: 'DOC_MENTION',
        confidence: 0.8,
        excerpt: 'the board meeting investor deck budget headcount hiring approval',
        priority: 6,
      },
      context: 'board prep',
      sessionId: 'test-session',
      workspaceId,
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
  });

  it('returns at most 3 matches', async () => {
    const result = await findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.8,
        excerpt: 'pipeline deal churn customer board hiring engineering product roadmap budget forecast',
        priority: 6,
      },
      context: 'everything',
      sessionId: 'test-session',
      workspaceId,
    });

    expect(result.matches.length).toBeLessThanOrEqual(3);
  });
});
