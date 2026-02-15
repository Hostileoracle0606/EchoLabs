import { MastraWorkflow, WorkflowContext, WorkflowResult, IntentDetection } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'
import { getSolutionsRegistry } from '@/services/prompts/solutions-registry'

/**
 * Intent Router Workflow
 * 
 * Purpose: Classify customer's intent from their opening statement
 * Trigger: State = INTENT_DETECTION, no intent locked yet
 * 
 * Phases:
 * 1. Load intent definitions
 * 2. Build classification prompt
 * 3. LLM classification  
 * 4. Confidence check (>= 0.75)
 * 5. Generate confirmation question or clarification
 * 6. Store and return
 */
export class IntentRouterWorkflow implements MastraWorkflow {
    private registry = getSolutionsRegistry()

    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { transcript, memory } = context

        // PHASE 1: Check for trigger keywords
        const matches = this.registry.classifyIntentByTriggers(transcript)

        if (matches.length === 0) {
            // No clear intent - ask exploratory question
            return {
                response: this.generateExploratoryQuestion(transcript),
                nextState: ConversationState.INTENT_DETECTION
            }
        }

        // PHASE 2 & 3: Get best match and calculate confidence
        const topMatch = matches[0]
        const confidence = this.calculateConfidence(topMatch.score, transcript)

        // PHASE 4: Confidence check
        if (confidence >= 0.75) {
            // High confidence - generate confirmation question
            const intent = this.registry.getIntent(topMatch.intent)
            if (!intent) {
                throw new Error(`Intent ${topMatch.intent} not found`)
            }

            const response = this.generateConfirmationQuestion(intent, transcript)

            return {
                response,
                nextState: ConversationState.INTENT_CONFIRMATION,
                intentDetected: {
                    intent: topMatch.intent,
                    confidence
                }
            }
        } else {
            // Low confidence - ask clarifying question
            return {
                response: this.generateClarifyingQuestion(transcript, topMatch.intent),
                nextState: ConversationState.INTENT_DETECTION
            }
        }
    }

    /**
     * Calculate confidence score based on trigger matches and transcript analysis
     */
    private calculateConfidence(matchScore: number, transcript: string): number {
        // Simple heuristic: more triggers matched = higher confidence
        // In production, use LLM for this
        const baseConfidence = Math.min(matchScore * 0.3, 0.9)

        // Boost confidence if transcript is longer (more context)
        const wordCount = transcript.split(' ').length
        const lengthBoost = wordCount > 20 ? 0.1 : 0

        return Math.min(baseConfidence + lengthBoost, 1.0)
    }

    /**
     * Generate confirmation question for detected intent
    */
    private generateConfirmationQuestion(intent: any, transcript: string): string {
        const templates = [
            `It sounds like you're dealing with ${this.intentToDescription(intent.id)}. Is that what you're trying to fix?`,
            `So you're looking to ${this.intentToAction(intent.id)}? Want to dig into that?`,
            `Looks like ${this.intentToProblem(intent.id)} is the main challenge. That right?`
        ]

        // Pick a random template to sound natural
        const template = templates[Math.floor(Math.random() * templates.length)]
        return template
    }

    /**
     * Generate clarifying question when confidence is low
     */
    private generateClarifyingQuestion(transcript: string, possibleIntent: string): string {
        return `Tell me more about what's going on. Are you looking to solve ${this.intentToProblem(possibleIntent)}, or is it something else?`
    }

    /**
     * Generate exploratory question when no intent detected
     */
    private generateExploratoryQuestion(transcript: string): string {
        return `I'd love to hear more about what's on your mind. What brings you here today?`
    }

    /**
     * Convert intent ID to human-readable description
     */
    private intentToDescription(intentId: string): string {
        const descriptions: Record<string, string> = {
            'ECOSYSTEM_MAPPING_INQUIRY': 'lead quality issues—getting traffic but not the right conversions',
            'VARIANT_TESTING_INQUIRY': 'testing and optimization to understand what works',
            'OFFER_ARCHITECTURE_INQUIRY': 'pricing and packaging challenges',
            'PERMISSION_MARKETING_INQUIRY': 'outreach and messaging that converts',
            'PRICING_INQUIRY': 'pricing and investment questions',
            'GENERAL_INQUIRY': 'understanding your business better'
        }
        return descriptions[intentId] || 'some challenges in your business'
    }

    /**
     * Convert intent ID to action phrase
     */
    private intentToAction(intentId: string): string {
        const actions: Record<string, string> = {
            'ECOSYSTEM_MAPPING_INQUIRY': 'understand your full marketing ecosystem',
            'VARIANT_TESTING_INQUIRY': 'test what\'s working and scale it',
            'OFFER_ARCHITECTURE_INQUIRY': 'get your pricing and positioning right',
            'PERMISSION_MARKETING_INQUIRY': 'improve your outreach and engagement',
            'PRICING_INQUIRY': 'understand the investment',
            'GENERAL_INQUIRY': 'explore your options'
        }
        return actions[intentId] || 'solve this'
    }

    /**
     * Convert intent ID to problem phrase
     */
    private intentToProblem(intentId: string): string {
        const problems: Record<string, string> = {
            'ECOSYSTEM_MAPPING_INQUIRY': 'channel alignment and lead quality',
            'VARIANT_TESTING_INQUIRY': 'testing and optimization',
            'OFFER_ARCHITECTURE_INQUIRY': 'pricing and positioning',
            'PERMISSION_MARKETING_INQUIRY': 'messaging and outreach',
            'PRICING_INQUIRY': 'pricing',
            'GENERAL_INQUIRY': 'your business challenges'
        }
        return problems[intentId] || 'this'
    }
}
