import { MastraWorkflow, WorkflowContext, WorkflowResult } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'

type AmbiguityType = 'UNCERTAIN_INTENT' | 'PARTIAL_UNDERSTANDING' | 'CONFUSION' | 'MULTIPLE_OPTIONS'

/**
 * Clarification Workflow
 * 
 * Purpose: Handle ambiguous or uncertain responses
 * Trigger: Customer gives vague response ("maybe', "I guess", "sort of")
 * 
 * Stays in current state, asks targeted clarifying question
 */
export class ClarificationWorkflow implements MastraWorkflow {
    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { transcript, state } = context

        // Analyze ambiguity type
        const ambiguityType = this.detectAmbiguityType(transcript)

        // Generate clarifying question
        const response = this.generateClarification(ambiguityType, transcript, state)

        // Stay in current state - we're just clarifying
        return {
            response,
            nextState: state // Stay where we are
        }
    }

    /**
     * Detect type of ambiguity in response
     */
    private detectAmbiguityType(transcript: string): AmbiguityType {
        const lower = transcript.toLowerCase()

        // Uncertain intent
        if (/maybe|i think|probably|possibly|i guess/i.test(lower)) {
            return 'UNCERTAIN_INTENT'
        }

        // Partial understanding
        if (/kind of|sort of|partly|somewhat/i.test(lower)) {
            return 'PARTIAL_UNDERSTANDING'
        }

        // Confusion
        if (/don't understand|confused|not sure what you mean|what/i.test(lower)) {
            return 'CONFUSION'
        }

        // Multiple options mentioned
        if (/both|either|or|and also/i.test(lower)) {
            return 'MULTIPLE_OPTIONS'
        }

        return 'PARTIAL_UNDERSTANDING'
    }

    /**
     * Generate appropriate clarification based on type
     */
    private generateClarification(
        type: AmbiguityType,
        transcript: string,
        state: ConversationState
    ): string {
        switch (type) {
            case 'UNCERTAIN_INTENT':
                return this.clarifyUncertainIntent(transcript)

            case 'PARTIAL_UNDERSTANDING':
                return this.clarifyPartialUnderstanding(transcript)

            case 'CONFUSION':
                return this.clarifyConfusion(transcript)

            case 'MULTIPLE_OPTIONS':
                return this.clarifyMultipleOptions(transcript)
        }
    }

    /**
     * Clarify uncertain intent with more context
     */
    private clarifyUncertainIntent(transcript: string): string {
        return "Let me rephrase that. I'm trying to understand if this is something you're actively trying to solve, or more of an idea you're exploring. Which feels more accurate?"
    }

    /**
     * Ask specific clarifying question for partial understanding
     */
    private clarifyPartialUnderstanding(transcript: string): string {
        return "Help me understand the 'sort of' part. What's the piece that doesn't quite fit?"
    }

    /**
     * Simplify and re-explain when confused
     */
    private clarifyConfusion(transcript: string): string {
        return "Let me simplify. I'm asking [restate question more clearly]. What's your take on that?"
    }

    /**
     * Help prioritize when multiple options given
     */
    private clarifyMultipleOptions(transcript: string): string {
        return "I hear you're thinking about multiple things. Which one would be most helpful to explore first?"
    }
}
