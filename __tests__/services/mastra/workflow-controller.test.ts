import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WorkflowController } from '@/services/mastra/workflow-controller'
import { ThreadMemory, ConversationState } from '@/services/memory/thread-memory'
import { MastraWorkflow, WorkflowResult, WorkflowContext } from '@/types/mastra-workflow'

// Mock workflow for Intent Detection
class MockIntentRouterWorkflow implements MastraWorkflow {
  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    return {
      response: 'I hear you need pricing info. Is that for your team?',
      nextState: ConversationState.INTENT_CONFIRMATION,
      intentDetected: {
        intent: 'PRICING_INQUIRY',
        confidence: 0.94
      }
    }
  }
}

// Mock workflow for Solution Exploration
class MockSolutionExplorerWorkflow implements MastraWorkflow {
  async execute(context: WorkflowContext): Promise<WorkflowResult> {
    return {
      response: 'What does a typical client pay you right now?',
      checkboxUpdates: {
        company_size: 50
      },
      checkboxWeights: {
        company_size: 1.0
      }
    }
  }
}

describe('WorkflowController', () => {
  let controller: WorkflowController
  let memory: ThreadMemory
  let mockIntentRouter: MockIntentRouterWorkflow
  let mockSolutionExplorer: MockSolutionExplorerWorkflow

  beforeEach(() => {
    memory = new ThreadMemory('test-session-123')
    mockIntentRouter = new MockIntentRouterWorkflow()
    mockSolutionExplorer = new MockSolutionExplorerWorkflow()

    const workflows = new Map()
    workflows.set(ConversationState.INTENT_DETECTION, mockIntentRouter)
    workflows.set(ConversationState.SOLUTION_EXPLORATION, mockSolutionExplorer)

    controller = new WorkflowController(memory, workflows)
  })

  it('should route to workflow based on current state', async () => {
    const transcript = 'I need pricing info'

    const response = await controller.processTranscript(transcript)

    expect(response).toBe('I hear you need pricing info. Is that for your team?')
  })

  it('should update memory based on workflow result', async () => {
    const transcript = 'I need pricing info'

    await controller.processTranscript(transcript)

    // Should have transitioned state
    expect(memory.getCurrentState()).toBe(ConversationState.INTENT_CONFIRMATION)
  })

  it('should lock intent when workflow detects one', async () => {
    const transcript = 'I need pricing info'

    await controller.processTranscript(transcript)

    const lock = memory.getIntentLock()
    expect(lock?.intent).toBe('PRICING_INQUIRY')
    expect(lock?.confidence).toBe(0.94)
  })

  it('should update checkboxes when workflow provides updates', async () => {
    // Transition to SOLUTION_EXPLORATION state
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    memory.transitionState(ConversationState.SOLUTION_EXPLORATION)

    const transcript = 'Yes, for about 50 users'

    await controller.processTranscript(transcript)

    const checkboxes = memory.getCheckboxes()
    expect(checkboxes).toHaveLength(1)
    expect(checkboxes[0].key).toBe('company_size')
    expect(checkboxes[0].value).toBe(50)
    expect(checkboxes[0].weight).toBe(1.0)
  })

  it('should throw error if no workflow for current state', async () => {
    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    // No workflow registered for INTENT_CONFIRMATION

    await expect(
      controller.processTranscript('yes')
    ).rejects.toThrow('No workflow for state')
  })

  it('should get current workflow for state', () => {
    const workflow = controller.getCurrentWorkflow()
    expect(workflow).toBe(mockIntentRouter)
  })

  it('should allow registering new workflows', () => {
    const newWorkflow = new MockIntentRouterWorkflow()

    controller.registerWorkflow(ConversationState.SUMMARY_REVIEW, newWorkflow)

    memory.transitionState(ConversationState.INTENT_CONFIRMATION)
    memory.transitionState(ConversationState.SOLUTION_EXPLORATION)
    memory.transitionState(ConversationState.SUMMARY_REVIEW)

    const workflow = controller.getCurrentWorkflow()
    expect(workflow).toBe(newWorkflow)
  })

  it('should not transition state if nextState is same as current', async () => {
    const originalState = memory.getCurrentState()

    // Mock workflow that returns same state
    const sameStateWorkflow: MastraWorkflow = {
      async execute() {
        return {
          response: 'Response',
          nextState: ConversationState.INTENT_DETECTION
        }
      }
    }

    const workflows = new Map()
    workflows.set(ConversationState.INTENT_DETECTION, sameStateWorkflow)
    controller = new WorkflowController(memory, workflows)

    await controller.processTranscript('test')

    expect(memory.getCurrentState()).toBe(originalState)
  })

  it('should pass correct context to workflow', async () => {
    let capturedContext: WorkflowContext | null = null

    const spyWorkflow: MastraWorkflow = {
      async execute(context: WorkflowContext) {
        capturedContext = context
        return { response: 'test response' }
      }
    }

    const workflows = new Map()
    workflows.set(ConversationState.INTENT_DETECTION, spyWorkflow)
    controller = new WorkflowController(memory, workflows)

    await controller.processTranscript('test transcript')

    expect(capturedContext).not.toBeNull()
    expect(capturedContext?.transcript).toBe('test transcript')
    expect(capturedContext?.memory).toBe(memory)
    expect(capturedContext?.state).toBe(ConversationState.INTENT_DETECTION)
  })
})
