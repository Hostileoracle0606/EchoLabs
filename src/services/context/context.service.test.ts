import { describe, it, expect } from 'vitest';
import { findContextMatches } from './context.service';

describe('ContextService', () => {
  it('matches email from Sarah about the budget', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.85,
        excerpt: 'As I mentioned in my email to Sarah about the budget',
        priority: 6,
      },
      context: 'discussing budget',
      sessionId: 'test-session',
    });

    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].matchType).toBe('email');
    expect(result.matches[0].from).toContain('Sarah');
    expect(result.matches[0].title).toContain('Budget');
  });

  it('matches a document about Q3 report', () => {
    const result = findContextMatches({
      intent: {
        type: 'DOC_MENTION',
        confidence: 0.86,
        excerpt: 'If you look at the Q3 quarterly review',
        priority: 6,
      },
      context: 'reviewing financials',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    // Best match should be a doc containing Q3
    const docMatch = result.matches.find((m) => m.matchType === 'doc');
    expect(docMatch).toBeTruthy();
    expect(docMatch!.title).toContain('Q3');
  });

  it('matches email about hiring engineers', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.8,
        excerpt: 'the hiring plan for engineers',
        priority: 6,
      },
      context: 'team growth',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    const match = result.matches[0];
    expect(match.from).toContain('Lisa');
  });

  it('returns empty matches for unrelated keywords', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.7,
        excerpt: 'the quantum physics paper from Oxford',
        priority: 6,
      },
      context: 'unrelated topic',
      sessionId: 'test-session',
    });

    expect(result.matches).toHaveLength(0);
  });

  it('scores relevance based on keyword overlap', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.9,
        excerpt: 'Sarah Q3 budget report final numbers',
        priority: 6,
      },
      context: 'financials',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    expect(result.matches[0].relevanceScore).toBeGreaterThan(0);
  });

  it('matches across all context types (email, doc, calendar, slack)', () => {
    const result = findContextMatches({
      intent: {
        type: 'DOC_MENTION',
        confidence: 0.8,
        excerpt: 'the product roadmap and strategy',
        priority: 6,
      },
      context: 'planning',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
  });

  it('returns at most 3 matches', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.8,
        excerpt: 'report quarterly review revenue budget engineering hiring',
        priority: 6,
      },
      context: 'everything',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeLessThanOrEqual(3);
  });
});
