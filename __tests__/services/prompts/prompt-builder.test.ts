import { describe, it, expect, beforeEach } from 'vitest'
import { PromptBuilder } from '@/services/prompts/prompt-builder'
import { ThreadMemory, ConversationState } from '@/services/memory/thread-memory'

describe('PromptBuilder', () => {
  let builder: PromptBuilder
  let memory: ThreadMemory

  beforeEach(async () => {
    builder = new PromptBuilder()
    await builder.initialize()

    memory = new ThreadMemory('test-session-123')
  })

  it('should initialize and cache base prompts', async () => {
    // Initialization happens in beforeEach
    // Verify by building a prompt
    const prompt = await builder.buildPrompt({
      workflow: 'INTENT_DETECTION',
      memory,
      clientContext: '# CLIENT CONTEXT\n\nTest client data'
    })

    expect(prompt).toContain('AGENT INSTRUCTIONS')
    expect(prompt).toContain('YOUR IDENTITY')
    expect(prompt).toContain('COMPLIANCE RULES')
  })

  it('should inject CLIENT.md context', async () => {
    const clientContext = '# CLIENT CONTEXT\n\nCompany: Acme Corp\nRevenue: $1M'

    const prompt = await builder.buildPrompt({
      workflow: 'INTENT_DETECTION',
      memory,
      clientContext
    })

    expect(prompt).toContain('Acme Corp')
    expect(prompt).toContain('$1M')
  })

  it('should inject conversation history', async () => {
    memory.addMessage({
      role: 'user',
      content: 'I need help with pricing',
      timestamp: Date.now()
    })

    const prompt = await builder.buildPrompt({
      workflow: 'INTENT_DETECTION',
      memory
    })

    expect(prompt).toContain('I need help with pricing')
  })

  it('should format checkbox progress', async () => {
    memory.updateCheckbox('company_size', 50, 1.0)
    memory.updateCheckbox('revenue_baseline', 10000, 1.0)

    const prompt = await builder.buildPrompt({
      workflow: 'SOLUTION_EXPLORATION',
      memory
    })

    expect(prompt).toContain('DISCOVERY PROGRESS')
    expect(prompt).toContain('[x] company_size: 50')
    expect(prompt).toContain('[x] revenue_baseline: 10000')
  })

  it('should include current state', async () => {
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)

    const prompt = await builder.buildPrompt({
      workflow: 'INTENT_CONFIRMATION',
      memory
    })

    expect(prompt).toContain('State: intent_confirmation')
  })

  it('should handle empty conversation history', async () => {
    const prompt = await builder.buildPrompt({
      workflow: 'INTENT_DETECTION',
      memory
    })

    expect(prompt).toContain('CONVERSATION HISTORY')
    // Should not crash with empty history
  })

  it('should include all base sections', async () => {
    const prompt = await builder.buildPrompt({
      workflow: 'INTENT_DETECTION',
      memory
    })

    expect(prompt).toContain('# AGENT INSTRUCTIONS')
    expect(prompt).toContain('# YOUR IDENTITY')
    expect(prompt).toContain('# COMPLIANCE RULES')
    expect(prompt).toContain('# CLIENT CONTEXT')
    expect(prompt).toContain('# CURRENT WORKFLOW')
    expect(prompt).toContain('# DISCOVERY PROGRESS')
    expect(prompt).toContain('# CONVERSATION HISTORY')
    expect(prompt).toContain('# YOUR TASK')
  })

  it('should use default CLIENT.md if none provided', async () => {
    const prompt = await builder.buildPrompt({
      workflow: 'INTENT_DETECTION',
      memory
    })

    // Should contain CLIENT.md from prompts directory
    expect(prompt).toContain('# CLIENT')
  })
})
