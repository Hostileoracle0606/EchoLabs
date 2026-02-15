import { MastraWorkflow, WorkflowContext, WorkflowResult } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'

type RepairStrategy = 'MINOR_CORRECTION' | 'MAJOR_MISUNDERSTANDING' | 'LOST_THREAD'

/**
 * Conversation Repair Workflow
 * 
 * Purpose: Handle confusion, misalignment, or explicit corrections
 * Trigger: Customer says "I'm lost", "wait", or explicit correction
 * 
 * Analyzes history, finds last point of agreement, repairs alignment
 */
export class ConversationRepairWorkflow implements MastraWorkflow {
    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { transcript, memory } = context

        // Determine repair strategy needed
        const strategy = this.determineRepairStrategy(transcript)

        // Generate repair response
        const response = this.generateRepairResponse(strategy, transcript, memory)

        // Determine where to restore to
        const nextState = this.determineRestoreState(strategy, memory)

        return {
            response,
            nextState
        }
    }

    /**
     * Determine what kind of repair is needed
     */
    private determineRepairStrategy(transcript: string): RepairStrategy {
        const lower = transcript.toLowerCase()

        // Major misunderstanding
        if (/no that's not|that's not what i said|you're wrong|completely wrong/i.test(lower)) {
            return 'MAJOR_MISUNDERSTANDING'
        }

        // Lost thread
        if (/lost|what were we|confused|don't follow|what are we talking about/i.test(lower)) {
            return 'LOST_THREAD'
        }

        // Default to minor correction
        return 'MINOR_CORRECTION'
    }

    /**
     * Generate repair response based on strategy
     */
    private generateRepairResponse(
        strategy: RepairStrategy,
        transcript: string,
        memory: any
    ): string {
        switch (strategy) {
            case 'MINOR_CORRECTION':
                return this.handleMinorCorrection(transcript)

            case 'MAJOR_MISUNDERSTANDING':
                return this.handleMajorMisunderstanding(memory)

            case 'LOST_THREAD':
                return this.handleLostThread(memory)
        }
    }

    /**
     * Handle minor correction
     */
    private handleMinorCorrection(transcript: string): string {
        return "Ah, I misunderstood. Let me correct that. What did you actually mean?"
    }

    /**
     * Handle major misunderstanding - full reset
     */
    private handleMajorMisunderstanding(memory: any): string {
        const history = memory.getRecentContext(3)

        return `Let me back up—I think I got turned around. Here's what I thought I heard: [brief recap]. But it sounds like that's not right. Help me understand what's actually going on?`
    }

    /**
     * Handle lost thread - provide recap
     */
    private handleLostThread(memory: any): string {
        const intentLock = memory.getIntentLock()

        if (intentLock) {
            return `No problem. We were exploring ${this.intentToDescription(intentLock.intent)}. I was trying to understand [last topic]. Want to continue with that, or did you want to talk about something else?`
        }

        return "Let me recap where we are. You mentioned [last clear point]. Was there something specific you wanted to focus on?"
    }

    /**
     * Determine which state to restore to
     */
    private determineRestoreState(strategy: RepairStrategy, memory: any): ConversationState {
        if (strategy === 'MAJOR_MISUNDERSTANDING') {
            // Go back to intent detection
            return ConversationState.INTENT_DETECTION
        }

        // Try to stay in current state if possible
        const currentState = memory.getCurrentState()
        return currentState
    }

    /**
     * Convert intent to human description
     */
    private intentToDescription(intentId: string): string {
        const descriptions: Record<string, string> = {
            'ECOSYSTEM_MAPPING_INQUIRY': 'how your marketing channels work together',
            'VARIANT_TESTING_INQUIRY': 'testing what works in your marketing',
            'OFFER_ARCHITECTURE_INQUIRY': 'your pricing and offer structure',
            'PERMISSION_MARKETING_INQUIRY': 'your outreach and messaging approach',
            'PRICING_INQUIRY': 'pricing and investment',
            'GENERAL_INQUIRY': 'your business challenges'
        }
        return descriptions[intentId] || 'your situation'
    }
}
