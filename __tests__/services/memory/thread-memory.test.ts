import { describe, it, expect, beforeEach } from 'vitest'
import { ThreadMemory, ConversationState } from '@/services/memory/thread-memory'

describe('ThreadMemory State Machine', () => {
  let memory: ThreadMemory

  beforeEach(() => {
    memory = new ThreadMemory('test-session-123')
  })

  it('should initialize with INTENT_DETECTION state', () => {
    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_DETECTION)
  })

  it('should transition from INTENT_DETECTION to INTENT_CONFIRMATION', () => {
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_CONFIRMATION)
  })

  it('should throw error on invalid state transition', () => {
    // Can't go directly from INTENT_DETECTION to SOLUTION_EXPLORATION
    expect(() => {
      memory.transitionState(ConversationState.SOLUTION_EXPLORATION)
    }).toThrow('Invalid state transition')
  })

  it('should allow valid transition path', () => {
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    memory.transitionState(ConversationState.SOLUTION_EXPLORATION)
    memory.transitionState(ConversationState.SUMMARY_REVIEW)
    memory.transitionState(ConversationState.INTENT_RESOLUTION)
    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_RESOLUTION)
  })

  it('should allow transition to OBJECTION_HANDLING from SOLUTION_EXPLORATION', () => {
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    memory.transitionState(ConversationState.SOLUTION_EXPLORATION)
    memory.transitionState(ConversationState.OBJECTION_HANDLING)
    expect(memory.getCurrentState()).toBe(ConversationState.OBJECTION_HANDLING)
  })

  it('should allow return to INTENT_DETECTION from INTENT_RESOLUTION', () => {
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    memory.transitionState(ConversationState.SOLUTION_EXPLORATION)
    memory.transitionState(ConversationState.SUMMARY_REVIEW)
    memory.transitionState(ConversationState.INTENT_RESOLUTION)
    memory.transitionState(ConversationState.INTENT_DETECTION)
    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_DETECTION)
  })
})

describe('ThreadMemory Checkbox Registry', () => {
  let memory: ThreadMemory

  beforeEach(() => {
    memory = new ThreadMemory('test-session-123')
  })

  it('should start with empty checkbox registry', () => {
    expect(memory.getCheckboxes()).toHaveLength(0)
    expect(memory.getCompletionScore()).toBe(0)
  })

  it('should update checkbox and calculate completion score', () => {
    // Add critical checkbox (weight 1.0)
    memory.updateCheckbox('company_size', 50, 1.0)

    expect(memory.getCheckboxes()).toHaveLength(1)
    expect(memory.getCompletionScore()).toBe(1.0) // 1.0 / 1.0 = 100%
  })

  it('should calculate weighted completion score correctly', () => {
    // Critical checkbox (weight 1.0)
    memory.updateCheckbox('current_channels', ['LinkedIn', 'Email'], 1.0)

    // Important checkbox (weight 0.7)
    memory.updateCheckbox('channel_coherence', 'misaligned', 0.7)

    // Nice-to-have checkbox (weight 0.3)
    memory.updateCheckbox('budget_range', 5000, 0.3)

    // Total weight: 1.0 + 0.7 + 0.3 = 2.0
    // Completed weight: 1.0 + 0.7 + 0.3 = 2.0
    // Score: 2.0 / 2.0 = 1.0
    expect(memory.getCompletionScore()).toBe(1.0)
  })

  it('should track partial completion score', () => {
    // Add 2 out of 5 critical checkboxes
    memory.updateCheckbox('checkbox1', 'value1', 1.0)
    memory.updateCheckbox('checkbox2', 'value2', 1.0)

    // Score reflects what's registered: 2.0 / 2.0 = 1.0
    expect(memory.getCompletionScore()).toBe(1.0)
  })

  it('should retrieve checkbox details', () => {
    memory.updateCheckbox('company_size', 50, 1.0)

    const checkboxes = memory.getCheckboxes()
    expect(checkboxes[0]).toMatchObject({
      key: 'company_size',
      value: 50,
      completed: true,
      weight: 1.0
    })
    expect(checkboxes[0].timestamp).toBeInstanceOf(Date)
  })
})

describe('ThreadMemory Intent Locking', () => {
  let memory: ThreadMemory

  beforeEach(() => {
    memory = new ThreadMemory('test-session-123')
  })

  it('should lock intent with confidence score', () => {
    memory.lockIntent('PRICING_INQUIRY', 0.94)

    const lock = memory.getIntentLock()
    expect(lock).toMatchObject({
      intent: 'PRICING_INQUIRY',
      confidence: 0.94
    })
    expect(lock?.lockedAt).toBeInstanceOf(Date)
  })

  it('should auto-transition to INTENT_CONFIRMATION when intent locked from INTENT_DETECTION', () => {
    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_DETECTION)

    memory.lockIntent('ECOSYSTEM_MAPPING_INQUIRY', 0.85)

    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_CONFIRMATION)
  })

  it('should not auto-transition if already past INTENT_DETECTION', () => {
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    memory.transitionState(ConversationState.SOLUTION_EXPLORATION)

    memory.lockIntent('PRICING_INQUIRY', 0.90)

    // Should stay in SOLUTION_EXPLORATION
    expect(memory.getCurrentState()).toBe(ConversationState.SOLUTION_EXPLORATION)
  })

  it('should release intent and reset state', () => {
    memory.lockIntent('PRICING_INQUIRY', 0.94)
    memory.updateCheckbox('revenue_baseline', 10000, 1.0)

    memory.releaseIntent()

    expect(memory.getIntentLock()).toBeNull()
    expect(memory.getCheckboxes()).toHaveLength(0)
    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_DETECTION)
  })
})
