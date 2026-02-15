import { MastraWorkflow, WorkflowContext, WorkflowResult } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'

type ObjectionType = 'PRICE_BUDGET' | 'TIME_BANDWIDTH' | 'TRUST_SKEPTICISM' | 'FIT_MISALIGNMENT' | 'AUTHORITY_DECISION'

/**
 * Objection Handler Workflow
 * 
 * Purpose: Identify objection type and respond with appropriate strategy
 * Trigger: Objection detected at any conversation state
 * 
 * Phases:
 * 1. Classify objection type
 * 2. Load appropriate strategy
 * 3. Build reframing response
 * 4. Update CLIENT.md with objection
 */
export class ObjectionHandlerWorkflow implements MastraWorkflow {
    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { transcript, memory } = context

        // PHASE 1: Classify objection type
        const objectionType = this.classifyObjection(transcript)

        // PHASE 2 & 3: Get strategy and build response
        const response = this.buildObjectionResponse(objectionType, transcript, memory)

        // Determine where to return (typically stay in current handling state)
        return {
            response,
            nextState: ConversationState.OBJECTION_HANDLING
        }
    }

    /**
     * Classify the type of objection
     */
    private classifyObjection(transcript: string): ObjectionType {
        const lower = transcript.toLowerCase()

        // Price/budget patterns
        if (/expensive|costly|too much|can't afford|budget/i.test(lower)) {
            return 'PRICE_BUDGET'
        }

        // Time/bandwidth patterns
        if (/don't have time|too busy|overwhelmed|bandwidth/i.test(lower)) {
            return 'TIME_BANDWIDTH'
        }

        // Trust/skepticism patterns
        if (/not sure|skeptical|doubt|guarantee|prove/i.test(lower)) {
            return 'TRUST_SKEPTICISM'
        }

        // Fit/misalignment patterns
        if (/not a fit|doesn't match|not what I need/i.test(lower)) {
            return 'FIT_MISALIGNMENT'
        }

        // Authority/decision patterns
        if (/need to ask|have to check|not my decision|partner|team/i.test(lower)) {
            return 'AUTHORITY_DECISION'
        }

        // Default to price if unclear
        return 'PRICE_BUDGET'
    }

    /**
     * Build response based on objection type
     */
    private buildObjectionResponse(
        type: ObjectionType,
        transcript: string,
        memory: any
    ): string {
        switch (type) {
            case 'PRICE_BUDGET':
                return this.handlePriceBudget(transcript, memory)

            case 'TIME_BANDWIDTH':
                return this.handleTimeBandwidth(transcript)

            case 'TRUST_SKEPTICISM':
                return this.handleTrustSkepticism(transcript)

            case 'FIT_MISALIGNMENT':
                return this.handleFitMisalignment(transcript)

            case 'AUTHORITY_DECISION':
                return this.handleAuthorityDecision(transcript)
        }
    }

    /**
     * Handle price/budget objection with value reframing
     */
    private handlePriceBudget(transcript: string, memory: any): string {
        // Try to anchor to ROI
        const checkboxes = memory.getCheckboxes()
        const revenueCheckbox = checkboxes.find((cb: any) =>
            cb.key === 'revenue_baseline' || cb.key === 'current_metrics'
        )

        if (revenueCheckbox && revenueCheckbox.value) {
            return `I get that. Let me put it in context. You mentioned ${revenueCheckbox.value}. If we solve this problem and you're able to improve that, what would that be worth to you over the next year?`
        }

        return "I understand. What would solving this problem be worth to your business over the next year?"
    }

    /**
     * Handle time/bandwidth objection with scope adjustment
     */
    private handleTimeBandwidth(transcript: string): string {
        return "I hear you on bandwidth. The goal isn't to add more to your plate—it's to simplify what you're already doing. What if we focused on just the one thing that would make the biggest difference?"
    }

    /**
     * Handle trust/skepticism with empathy and proof
     */
    private handleTrustSkepticism(transcript: string): string {
        return "That's fair—you should be skeptical. I wouldn't guarantee results either because every business is different. What I can do is show you the diagnostic process we'd use and let you decide if it makes sense. Want to see what that looks like?"
    }

    /**
     * Handle fit/misalignment with discovery repair
     */
    private handleFitMisalignment(transcript: string): string {
        return "Let me make sure I understand what you're actually looking for. What would the right fit look like to you?"
    }

    /**
     * Handle authority/decision-maker objection
     */
    private handleAuthorityDecision(transcript: string): string {
        return "Totally makes sense. Who else needs to be part of this conversation? I want to make sure anyone who has input gets their questions answered."
    }
}
