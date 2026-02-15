import { MastraWorkflow, WorkflowContext, WorkflowResult } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'
import { getSolutionsRegistry } from '@/services/prompts/solutions-registry'

type ResponseType = 'CONFIRMATION' | 'REJECTION' | 'UNCERTAIN' | 'TANGENT'

/**
 * Intent Confirmation Workflow
 * 
 * Purpose: Get explicit yes/no confirmation from customer before locking intent
 * Trigger: Intent detected with high confidence, awaiting customer validation
 * 
 * Phases:
 * 1. Parse response type (yes/no/maybe/tangent)
 * 2. Extract additional context from response
 * 3. Lock intent if confirmed, initialize checkboxes
 * 4. Generate transition response
 * 5. Update state
 */
export class IntentConfirmationWorkflow implements MastraWorkflow {
    private registry = getSolutionsRegistry()

    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { transcript, memory } = context

        // PHASE 1: Parse response type
        const responseType = this.detectResponseType(transcript)

        switch (responseType) {
            case 'CONFIRMATION':
                return this.handleConfirmation(transcript, memory)

            case 'REJECTION':
                return this.handleRejection(transcript)

            case 'UNCERTAIN':
                return this.handleUncertain(transcript, memory)

            case 'TANGENT':
                return this.handleTangent(transcript, memory)
        }
    }

    /**
     * Detect the type of response from customer
     */
    private detectResponseType(transcript: string): ResponseType {
        const lower = transcript.toLowerCase()

        // Confirmation patterns
        const confirmPatterns = /\b(yes|exactly|that's right|spot on|correct|yeah|yep|absolutely)\b/i
        if (confirmPatterns.test(lower)) {
            return 'CONFIRMATION'
        }

        // Rejection patterns
        const rejectPatterns = /\b(no|not quite|actually|instead|not really|nah)\b/i
        if (rejectPatterns.test(lower)) {
            return 'REJECTION'
        }

        // Uncertain patterns
        const uncertainPatterns = /\b(maybe|i guess|sort of|kind of|i'm not sure|possibly)\b/i
        if (uncertainPatterns.test(lower)) {
            return 'UNCERTAIN'
        }

        // Default to tangent if unclear
        return 'TANGENT'
    }

    /**
     * Handle confirmation response
     */
    private async handleConfirmation(transcript: string, memory: any): Promise<WorkflowResult> {
        const intentLock = memory.getIntentLock()
        if (!intentLock) {
            throw new Error('No intent to confirm')
        }

        // PHASE 2: Extract additional context
        const extractedContext = this.extractContext(transcript)

        // PHASE 3: Initialize checkboxes
        const checkboxes = this.registry.getCheckboxes(intentLock.intent)
        const checkboxUpdates: Record<string, any> = {}
        const checkboxWeights: Record<string, number> = {}

        // Pre-fill any checkboxes from extracted context
        for (const [key, value] of Object.entries(extractedContext)) {
            const checkbox = checkboxes.find(cb => cb.key === key)
            if (checkbox) {
                checkboxUpdates[key] = value
                checkboxWeights[key] = checkbox.weight
            }
        }

        // PHASE 4: Generate transition to first discovery question
        const firstQuestion = this.generateFirstDiscoveryQuestion(intentLock.intent, extractedContext, checkboxes)

        return {
            response: firstQuestion,
            nextState: ConversationState.SOLUTION_EXPLORATION,
            checkboxUpdates,
            checkboxWeights
        }
    }

    /**
     * Handle rejection response - restart intent detection
     */
    private handleRejection(transcript: string): WorkflowResult {
        return {
            response: "Ah, I misunderstood. What are you actually trying to solve?",
            nextState: ConversationState.INTENT_DETECTION
        }
    }

    /**
     * Handle uncertain response - rephrase confirmation
     */
    private handleUncertain(transcript: string, memory: any): WorkflowResult {
        const intentLock = memory.getIntentLock()
        if (!intentLock) {
            return {
                response: "Let me back up. What's the main thing you're looking to figure out?",
                nextState: ConversationState.INTENT_DETECTION
            }
        }

        return {
            response: `Let me rephrase: It seems like you're trying to ${this.intentToGoal(intentLock.intent)}. Does that sound closer to what you're thinking about?`,
            nextState: ConversationState.INTENT_CONFIRMATION
        }
    }

    /**
     * Handle tangent - gentle redirect
     */
    private handleTangent(transcript: string, memory: any): WorkflowResult {
        return {
            response: "I want to make sure I understand what matters most to you. Is [the detected intent] what you're mainly focused on fixing?",
            nextState: ConversationState.INTENT_CONFIRMATION
        }
    }

    /**
     * Extract structured context from customer response
     * (In production, use LLM for this)
     */
    private extractContext(transcript: string): Record<string, any> {
        const context: Record<string, any> = {}

        // Extract channel count if mentioned
        const channelMatch = transcript.match(/(\d+)\s+channel/i)
        if (channelMatch) {
            context['current_channels'] = `${channelMatch[1]} channels`
        }

        // Extract coherence issues
        if (/different|misaligned|inconsistent/i.test(transcript)) {
            context['channel_coherence'] = 'Appears misaligned'
        }

        // More extraction logic...

        return context
    }

    /**
     * Generate first discovery question
     */
    private generateFirstDiscoveryQuestion(
        intentId: string,
        extractedContext: Record<string, any>,
        allCheckboxes: any[]
    ): string {
        // Find first uncompleted CRITICAL checkbox
        const criticalCheckboxes = allCheckboxes.filter(cb => cb.weight === 1.0)
        const firstCheckbox = criticalCheckboxes[0]

        if (!firstCheckbox) {
            return "Let's explore this together. What's the first thing you'd want me to understand?"
        }

        // Build natural transition
        const acknowledgment = Object.keys(extractedContext).length > 0
            ? this.acknowledgeContext(extractedContext)
            : "Perfect."

        return `${acknowledgment} ${firstCheckbox.question}`
    }

    /**
     * Acknowledge extracted context naturally
     */
    private acknowledgeContext(context: Record<string, any>): string {
        const keys = Object.keys(context)
        if (keys.includes('current_channels')) {
            const channelInfo = context['current_channels']
            return `Perfect. ${channelInfo}—that's a lot to coordinate.`
        }
        return "Got it."
    }

    /**
     * Convert intent to goal statement
     */
    private intentToGoal(intentId: string): string {
        const goals: Record<string, string> = {
            'ECOSYSTEM_MAPPING_INQUIRY': 'understand how your channels work together and find the conversion leaks',
            'VARIANT_TESTING_INQUIRY': 'test different approaches to see what actually works',
            'OFFER_ARCHITECTURE_INQUIRY': 'get your pricing and packaging right',
            'PERMISSION_MARKETING_INQUIRY': 'improve how you reach out and engage leads',
            'PRICING_INQUIRY': 'understand the investment and ROI',
            'GENERAL_INQUIRY': 'explore what\'s possible'
        }
        return goals[intentId] || 'solve this challenge'
    }
}
