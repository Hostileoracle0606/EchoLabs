import { ConversationState } from './conversation-state'
import { ThreadMemory } from '@/services/memory/thread-memory'

export interface WorkflowContext {
  transcript: string
  memory: ThreadMemory
  state: ConversationState
}

export interface IntentDetection {
  intent: string
  confidence: number
}

export interface WorkflowResult {
  response: string
  nextState?: ConversationState
  intentDetected?: IntentDetection
  checkboxUpdates?: Record<string, any>
  checkboxWeights?: Record<string, number>
}

export interface MastraWorkflow {
  execute(context: WorkflowContext): Promise<WorkflowResult>
}
