/**
 * Conversation State Machine
 * Defines all possible states in a sales conversation
 * Transitions are enforced by ThreadMemory
 */
export enum ConversationState {
  INTENT_DETECTION = 'intent_detection',
  INTENT_CONFIRMATION = 'intent_confirmation',
  SOLUTION_EXPLORATION = 'solution_exploration',
  SUMMARY_REVIEW = 'summary_review',
  OBJECTION_HANDLING = 'objection_handling',
  INTENT_RESOLUTION = 'intent_resolution',
  CONVERSATION_REPAIR = 'conversation_repair'
}

/**
 * Valid state transitions
 * Key: Current state
 * Value: Array of allowed next states
 */
export const VALID_TRANSITIONS: Record<ConversationState, ConversationState[]> = {
  [ConversationState.INTENT_DETECTION]: [
    ConversationState.INTENT_CONFIRMATION
  ],
  [ConversationState.INTENT_CONFIRMATION]: [
    ConversationState.SOLUTION_EXPLORATION,
    ConversationState.INTENT_DETECTION
  ],
  [ConversationState.SOLUTION_EXPLORATION]: [
    ConversationState.SUMMARY_REVIEW,
    ConversationState.OBJECTION_HANDLING
  ],
  [ConversationState.SUMMARY_REVIEW]: [
    ConversationState.INTENT_RESOLUTION,
    ConversationState.SOLUTION_EXPLORATION
  ],
  [ConversationState.OBJECTION_HANDLING]: [
    ConversationState.SOLUTION_EXPLORATION,
    ConversationState.SUMMARY_REVIEW
  ],
  [ConversationState.INTENT_RESOLUTION]: [
    ConversationState.INTENT_DETECTION
  ],
  [ConversationState.CONVERSATION_REPAIR]: [
    ConversationState.INTENT_DETECTION,
    ConversationState.SOLUTION_EXPLORATION
  ]
}
