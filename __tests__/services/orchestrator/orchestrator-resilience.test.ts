import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processTranscript } from '@/services/orchestrator/orchestrator.service'
import type { OrchestratorRequest } from '@/types/agents'

// Mock dependencies
vi.mock('@/services/orchestrator/intent-classifier', () => ({
  classifyIntents: vi.fn()
}))

vi.mock('@/services/sales/sales-orchestrator', () => ({
  processSalesTranscript: vi.fn()
}))

vi.mock('@/services/mastra/mastra-runtime', () => ({
  getMastraConversationRuntime: vi.fn(() => ({
    processTranscript: vi.fn().mockResolvedValue({})
  }))
}))

describe('Orchestrator Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should continue orchestration when intent classification fails', async () => {
    const { classifyIntents } = await import('@/services/orchestrator/intent-classifier')
    const { processSalesTranscript } = await import('@/services/sales/sales-orchestrator')

    // Mock classifyIntents to throw an error
    vi.mocked(classifyIntents).mockRejectedValue(new Error('Classification API down'))

    // Mock sales orchestrator to succeed
    vi.mocked(processSalesTranscript).mockResolvedValue({
      stage: 'discovery',
      signals: [],
      objections: [],
      buyingSignals: [],
      nextActions: [],
      summary: 'Conversation summary',
      metadata: {}
    })

    const request: OrchestratorRequest = {
      text: 'I need help with my business',
      sessionId: 'session-123',
      timestamp: new Date(),
      speaker: 'customer'
    }

    // Should NOT throw even though classification failed
    const result = await processTranscript(request)

    // Should still process sales transcript
    expect(result).toBeDefined()
    expect(result.stage).toBe('discovery')

    // Should have attempted classification
    expect(classifyIntents).toHaveBeenCalledWith(request.text)

    // Should have called sales orchestrator despite classification failure
    expect(processSalesTranscript).toHaveBeenCalled()
  })

  it('should throw when sales orchestrator fails', async () => {
    const { classifyIntents } = await import('@/services/orchestrator/intent-classifier')
    const { processSalesTranscript } = await import('@/services/sales/sales-orchestrator')

    // Mock classifyIntents to succeed
    vi.mocked(classifyIntents).mockResolvedValue({
      intents: [{ type: 'DISCOVER_GROWTH', confidence: 0.9 }],
      confidence: 0.9
    })

    // Mock sales orchestrator to fail
    vi.mocked(processSalesTranscript).mockRejectedValue(new Error('Sales processing failed'))

    const request: OrchestratorRequest = {
      text: 'I need help with my business',
      sessionId: 'session-123',
      timestamp: new Date(),
      speaker: 'customer'
    }

    // Should throw when sales processing fails (critical path)
    await expect(processTranscript(request)).rejects.toThrow('Sales processing failed')
  })

  it('should handle empty classification gracefully', async () => {
    const { classifyIntents } = await import('@/services/orchestrator/intent-classifier')
    const { processSalesTranscript } = await import('@/services/sales/sales-orchestrator')

    // Mock classifyIntents to return empty result
    vi.mocked(classifyIntents).mockResolvedValue({
      intents: [],
      confidence: 0
    })

    vi.mocked(processSalesTranscript).mockResolvedValue({
      stage: 'discovery',
      signals: [],
      objections: [],
      buyingSignals: [],
      nextActions: [],
      summary: 'Conversation summary',
      metadata: {}
    })

    const request: OrchestratorRequest = {
      text: 'Hello',
      sessionId: 'session-123',
      timestamp: new Date(),
      speaker: 'customer'
    }

    const result = await processTranscript(request)

    // Should handle empty classification without errors
    expect(result).toBeDefined()
    expect(result.stage).toBe('discovery')
  })
})
