import { ConversationState, VALID_TRANSITIONS } from '@/types/conversation-state'

export interface ThreadMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface CheckboxState {
  key: string
  value: any
  completed: boolean
  weight: number
  timestamp: Date
}

export interface IntentLock {
  intent: string
  lockedAt: Date
  confidence: number
}

/**
 * ThreadMemory - Extended with state machine capabilities
 * Single source of truth for conversation state, history, and discovery progress
 */
export class ThreadMemory {
  // EXISTING: Conversation history
  private conversationHistory: ThreadMessage[] = []

  // NEW: State machine properties
  private state: ConversationState = ConversationState.INTENT_DETECTION
  private intentLock: IntentLock | null = null
  private checkboxRegistry: Map<string, CheckboxState> = new Map()

  constructor(private sessionId: string) {
    // Initialize
  }

  // EXISTING: Message management
  addMessage(message: ThreadMessage): void {
    this.conversationHistory.push(message)
  }

  getRecentContext(turns: number = 5): string {
    const recent = this.conversationHistory.slice(-turns * 2) // * 2 for user + assistant pairs
    return recent
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n')
  }

  getConversationHistory(): ThreadMessage[] {
    return [...this.conversationHistory]
  }

  // NEW: State machine methods
  lockIntent(intent: string, confidence: number): void {
    this.intentLock = { intent, confidence, lockedAt: new Date() }

    // Auto-transition to INTENT_CONFIRMATION when intent locked from INTENT_DETECTION
    if (this.state === ConversationState.INTENT_DETECTION) {
      this.transitionState(ConversationState.INTENT_CONFIRMATION)
    }
  }

  releaseIntent(): void {
    this.intentLock = null
    this.checkboxRegistry.clear()
    this.state = ConversationState.INTENT_DETECTION
  }

  getIntentLock(): IntentLock | null {
    return this.intentLock
  }

  updateCheckbox(key: string, value: any, weight: number): void {
    this.checkboxRegistry.set(key, {
      key,
      value,
      completed: true,
      weight,
      timestamp: new Date()
    })
  }

  getCompletionScore(): number {
    let totalWeight = 0
    let completedWeight = 0

    for (const checkbox of this.checkboxRegistry.values()) {
      totalWeight += checkbox.weight
      if (checkbox.completed) {
        completedWeight += checkbox.weight
      }
    }

    return totalWeight > 0 ? completedWeight / totalWeight : 0
  }

  transitionState(newState: ConversationState): void {
    const validNextStates = VALID_TRANSITIONS[this.state]

    if (!validNextStates.includes(newState)) {
      throw new Error(
        `Invalid state transition: ${this.state} -> ${newState}. ` +
        `Valid transitions: ${validNextStates.join(', ')}`
      )
    }

    this.state = newState
  }

  getCurrentState(): ConversationState {
    return this.state
  }

  getCheckboxes(): CheckboxState[] {
    return Array.from(this.checkboxRegistry.values())
  }

  getSessionId(): string {
    return this.sessionId
  }
}

// EXISTING: Legacy global store (keep for backward compatibility)
export class ThreadMemoryStore {
  private threads = new Map<string, ThreadMessage[]>();

  addMessage(threadId: string, message: ThreadMessage) {
    const thread = this.threads.get(threadId) ?? [];
    thread.push(message);
    this.threads.set(threadId, thread);
  }

  getThread(threadId: string, limit = 10): ThreadMessage[] {
    const thread = this.threads.get(threadId) ?? [];
    return thread.slice(-limit);
  }

  async semanticSearch(threadId: string, query: string, limit = 3): Promise<ThreadMessage[]> {
    // TODO: Replace with Mastra memory semantic search.
    void query;
    return this.getThread(threadId, limit);
  }
}

const globalForMemory = global as unknown as { threadMemory?: ThreadMemoryStore };

export function getThreadMemory(): ThreadMemoryStore {
  if (!globalForMemory.threadMemory) {
    globalForMemory.threadMemory = new ThreadMemoryStore();
  }
  return globalForMemory.threadMemory;
}

export { ConversationState }
