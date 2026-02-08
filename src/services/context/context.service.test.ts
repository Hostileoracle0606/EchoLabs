import { describe, it, expect } from 'vitest';
import { findContextMatches } from './context.service';

describe('ContextService', () => {
  it('matches email from Evelyn about regulatory risk', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.85,
        excerpt: 'Evelyn flagged a regulatory antitrust risk on the OmniCorp deal',
        priority: 6,
      },
      context: 'discussing deal risks',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    const emailMatch = result.matches.find((m) => m.matchType === 'email');
    expect(emailMatch).toBeTruthy();
    expect(emailMatch!.from).toContain('Evelyn');
  });

  it('matches a document about the IC memo', () => {
    const result = findContextMatches({
      intent: {
        type: 'DOC_MENTION',
        confidence: 0.86,
        excerpt: 'the investment committee memo on the OmniCorp acquisition',
        priority: 6,
      },
      context: 'reviewing deal documents',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    const docMatch = result.matches.find((m) => m.matchType === 'doc');
    expect(docMatch).toBeTruthy();
    expect(docMatch!.title).toContain('IC_Memo');
  });

  it('matches email about churn and NDR metrics', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.8,
        excerpt: 'Rajiv validated the churn retention NDR multiple',
        priority: 6,
      },
      context: 'valuation analysis',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
    const match = result.matches.find((m) => m.from?.includes('Rajiv'));
    expect(match).toBeTruthy();
  });

  it('returns empty matches for unrelated keywords', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.7,
        excerpt: 'the quantum physics paper from Oxford university laboratory',
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
        excerpt: 'OmniCorp regulatory antitrust risk deal break fee',
        priority: 6,
      },
      context: 'deal risk assessment',
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
        excerpt: 'the OmniCorp deal investment committee review negotiation',
        priority: 6,
      },
      context: 'deal review',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeGreaterThanOrEqual(1);
  });

  it('returns at most 3 matches', () => {
    const result = findContextMatches({
      intent: {
        type: 'EMAIL_MENTION',
        confidence: 0.8,
        excerpt: 'OmniCorp investment committee review regulatory risk valuation IRR fund',
        priority: 6,
      },
      context: 'everything',
      sessionId: 'test-session',
    });

    expect(result.matches.length).toBeLessThanOrEqual(3);
  });
});
