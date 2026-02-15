import { describe, it, expect } from 'vitest'
import { ComplianceEngine } from '@/services/mastra/compliance-engine'
import { ConversationState } from '@/types/conversation-state'

describe('ComplianceEngine', () => {
  it('flags forbidden phrases from PROMPT.md', () => {
    const engine = new ComplianceEngine()
    const result = engine.validatePost('As an AI, I cannot help with that.')
    expect(result.violations.some(v => v.type === 'forbidden_phrase')).toBe(true)
  })

  it('parses rules from RULES.md', () => {
    const engine = new ComplianceEngine()
    const rules = engine.getParsedRules()
    expect(rules.length).toBeGreaterThan(0)
  })

  it('flags premature pitch in pre-validation', () => {
    const engine = new ComplianceEngine()
    const result = engine.validatePre({
      state: ConversationState.INTENT_RESOLUTION,
      completionScore: 0.2,
      intentLocked: true
    })
    expect(result.violations.some(v => v.type === 'premature_pitch')).toBe(true)
  })

  it('flags permission missing for directive closes', () => {
    const engine = new ComplianceEngine()
    const result = engine.validatePost('Let\'s schedule a follow-up call.', {
      state: ConversationState.INTENT_RESOLUTION,
      completionScore: 0.9,
      intentLocked: true
    })
    expect(result.violations.some(v => v.type === 'permission_missing')).toBe(true)
  })

  it('flags meaning over literal compliance when user is uncertain', () => {
    const engine = new ComplianceEngine()
    const result = engine.validatePost('Absolutely, let\'s do it.', {
      state: ConversationState.SOLUTION_EXPLORATION,
      completionScore: 0.4,
      intentLocked: false,
      lastUserMessage: 'I\'m not sure yet.'
    })
    expect(result.violations.some(v => v.type === 'meaning_over_literal')).toBe(true)
  })

  it('sanitizes proposals with permission language', () => {
    const engine = new ComplianceEngine()
    const sanitized = engine.sanitize('Here\'s what I\'d recommend: start with an audit.', {
      state: ConversationState.INTENT_RESOLUTION,
      completionScore: 0.9,
      intentLocked: true
    })
    expect(/does that sound|would that help|make sense/i.test(sanitized)).toBe(true)
  })

  it('flags pricing without enough context', () => {
    const engine = new ComplianceEngine()
    const result = engine.validatePost('Pricing is $500 per month.', {
      state: ConversationState.SOLUTION_EXPLORATION,
      completionScore: 0.2,
      intentLocked: true
    })
    expect(result.violations.some(v => v.type === 'pricing_without_context')).toBe(true)
  })
})
