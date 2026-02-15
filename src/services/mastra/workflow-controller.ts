import { ThreadMemory } from '@/services/memory/thread-memory'
import { ConversationState } from '@/types/conversation-state'
import { MastraWorkflow, WorkflowContext } from '@/types/mastra-workflow'

/**
 * WorkflowController
 * Routes transcripts to appropriate Mastra workflows based on current state
 * Implements the orchestration logic defined in AGENT.md
 */
export class WorkflowController {
  constructor(
    private memory: ThreadMemory,
    private workflows: Map<ConversationState, MastraWorkflow>
  ) {}

  /**
   * Process a transcript chunk through the appropriate workflow
   * This is the main entry point for conversation processing
   */
  async processTranscript(transcript: string): Promise<string> {
    const currentState = this.memory.getCurrentState()
    const workflow = this.workflows.get(currentState)

    if (!workflow) {
      throw new Error(`No workflow for state: ${currentState}`)
    }

    // Execute workflow with full context
    const result = await workflow.execute({
      transcript,
      memory: this.memory,
      state: currentState
    })

    // Handle state transitions
    if (result.nextState && result.nextState !== currentState) {
      this.memory.transitionState(result.nextState)
    }

    // Lock intent if detected
    if (result.intentDetected) {
      this.memory.lockIntent(
        result.intentDetected.intent,
        result.intentDetected.confidence
      )
    }

    // Update checkboxes if provided
    if (result.checkboxUpdates) {
      for (const [key, value] of Object.entries(result.checkboxUpdates)) {
        const weight = result.checkboxWeights?.[key] || 1.0
        this.memory.updateCheckbox(key, value, weight)
      }
    }

    return result.response
  }

  /**
   * Get the workflow for the current state
   */
  getCurrentWorkflow(): MastraWorkflow | undefined {
    const currentState = this.memory.getCurrentState()
    return this.workflows.get(currentState)
  }

  /**
   * Register a workflow for a specific state
   * Allows dynamic workflow registration
   */
  registerWorkflow(state: ConversationState, workflow: MastraWorkflow): void {
    this.workflows.set(state, workflow)
  }

  /**
   * Get the current conversation state
   */
  getCurrentState(): ConversationState {
    return this.memory.getCurrentState()
  }

  /**
   * Get the thread memory instance
   */
  getMemory(): ThreadMemory {
    return this.memory
  }
}
