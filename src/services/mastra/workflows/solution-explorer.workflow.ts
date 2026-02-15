import { MastraWorkflow, WorkflowContext, WorkflowResult } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'
import { getSolutionsRegistry } from '@/services/prompts/solutions-registry'
import { CheckboxState } from '@/services/memory/thread-memory'

/**
 * Solution Explorer Workflow
 * 
 * Purpose: Systematically discover information by asking weighted checkbox questions
 * Trigger: Intent locked, state = SOLUTION_EXPLORATION, completeness < 0.8
 * 
 * Phases:
 * 1. Extract answer to current checkbox question
 * 2. Update checkbox in ThreadMemory
 * 3. Calculate completeness score (weighted)
 * 4. Select next uncompleted checkbox (prioritize by weight)
 * 5. Generate natural discovery question
 * 6. Transition to SUMMARY_REVIEW when completeness >= 0.8
 */
export class SolutionExplorerWorkflow implements MastraWorkflow {
    private registry = getSolutionsRegistry()
    private readonly COMPLETION_THRESHOLD = 0.8

    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { transcript, memory } = context
        const intentLock = memory.getIntentLock()

        if (!intentLock) {
            throw new Error('No intent locked - cannot explore')
        }

        // PHASE 1: Extract answer from transcript
        const currentCheckboxes = memory.getCheckboxes()
        const extractedData = this.extractAnswerData(transcript, currentCheckboxes)

        // PHASE 2: Update checkboxes
        const checkboxUpdates: Record<string, any> = {}
        const checkboxWeights: Record<string, number> = {}

        const allCheckboxes = this.registry.getCheckboxes(intentLock.intent)
        for (const [key, value] of Object.entries(extractedData)) {
            const checkboxDef = allCheckboxes.find(cb => cb.key === key)
            if (checkboxDef) {
                checkboxUpdates[key] = value
                checkboxWeights[key] = checkboxDef.weight
            }
        }

        // PHASE 3: Calculate completeness
        // We need to simulate the updated state to calculate new completion
        const simulatedCheckboxes = this.simulateUpdatedCheckboxes(
            currentCheckboxes,
            checkboxUpdates,
            checkboxWeights,
            allCheckboxes
        )
        const completeness = this.calculateCompleteness(simulatedCheckboxes, allCheckboxes)

        // PHASE 4 & 5: Check threshold and route
        if (completeness >= this.COMPLETION_THRESHOLD) {
            // Ready for summary
            return {
                response: "Let me make sure I'm tracking with you here...",
                nextState: ConversationState.SUMMARY_REVIEW,
                checkboxUpdates,
                checkboxWeights
            }
        }

        // PHASE 5: Find next question
        const nextCheckbox = this.findNextCheckbox(simulatedCheckboxes, allCheckboxes)

        if (!nextCheckbox) {
            // All done even though score < 0.8 (shouldn't happen but handle gracefully)
            return {
                response: "I think I have a good picture. Let me summarize what I'm hearing...",
                nextState: ConversationState.SUMMARY_REVIEW,
                checkboxUpdates,
                checkboxWeights
            }
        }

        // PHASE 6: Generate discovery question
        const discoveryQuestion = this.generateDiscoveryQuestion(transcript, nextCheckbox)

        return {
            response: discoveryQuestion,
            nextState: ConversationState.SOLUTION_EXPLORATION,
            checkboxUpdates,
            checkboxWeights
        }
    }

    /**
     * Extract structured data from customer transcript
     * (In production, use LLM for sophisticated extraction)
     */
    private extractAnswerData(transcript: string, currentCheckboxes: CheckboxState[]): Record<string, any> {
        const data: Record<string, any> = {}

        // Simple extraction heuristics
        // In production, you'd use LLM to extract structured data

        // Channel coherence extraction
        if (/different|misaligned|inconsistent/i.test(transcript)) {
            data['channel_coherence'] = `Misaligned - ${transcript.substring(0, 100)}`
        } else if (/same|aligned|consistent/i.test(transcript)) {
            data['channel_coherence'] = `Aligned - ${transcript.substring(0, 100)}`
        }

        // Lead quality variance
        if (/hot.*cold|week.*week|variance|inconsistent/i.test(transcript)) {
            data['lead_quality_variance'] = transcript.substring(0, 100)
        }

        // Metrics
        if (/conversion|ctr|revenue|roi/i.test(transcript)) {
            data['current_metrics'] = transcript.substring(0, 100)
        }

        // Budget range
        const budgetMatch = transcript.match(/\$[\d,]+/i)
        if (budgetMatch) {
            data['budget_range'] = budgetMatch[0]
        }

        // More sophisticated extraction would go here...

        return data
    }

    /**
     * Simulate what checkboxes would look like after updates
     */
    private simulateUpdatedCheckboxes(
        current: CheckboxState[],
        updates: Record<string, any>,
        weights: Record<string, number>,
        allDefinitions: any[]
    ): CheckboxState[] {
        const simulated = [...current]

        for (const [key, value] of Object.entries(updates)) {
            const existing = simulated.find(cb => cb.key === key)
            if (existing) {
                existing.value = value
                existing.completed = true
            } else {
                simulated.push({
                    key,
                    value,
                    completed: true,
                    weight: weights[key] || 1.0,
                    timestamp: new Date()
                })
            }
        }

        return simulated
    }

    /**
     * Calculate weighted completion score
     */
    private calculateCompleteness(completed: CheckboxState[], allCheckboxes: any[]): number {
        let totalWeight = 0
        let completedWeight = 0

        for (const checkbox of allCheckboxes) {
            totalWeight += checkbox.weight
        }

        for (const checkbox of completed) {
            if (checkbox.completed) {
                completedWeight += checkbox.weight
            }
        }

        return totalWeight > 0 ? completedWeight / totalWeight : 0
    }

    /**
     * Find next uncompleted checkbox, prioritized by weight
     */
    private findNextCheckbox(completed: CheckboxState[], allCheckboxes: any[]): any | null {
        const completedKeys = new Set(completed.filter(cb => cb.completed).map(cb => cb.key))

        // Filter to uncompleted only
        const uncompleted = allCheckboxes.filter(cb => !completedKeys.has(cb.key))

        if (uncompleted.length === 0) {
            return null
        }

        // Sort by weight descending (1.0 -> 0.7 -> 0.3)
        uncompleted.sort((a, b) => b.weight - a.weight)

        return uncompleted[0]
    }

    /**
     * Generate natural discovery question
     */
    private generateDiscoveryQuestion(previousTranscript: string, checkbox: any): string {
        // Acknowledge their previous answer
        const acknowledgment = this.generateAcknowledgment(previousTranscript)

        // Use the checkbox question
        const question = checkbox.question

        return `${acknowledgment} ${question}`
    }

    /**
     * Generate natural acknowledgment of previous answer
     */
    private generateAcknowledgment(transcript: string): string {
        const acknowledgments = [
            "Got it.",
            "That makes sense.",
            "Interesting.",
            "I hear you.",
            "Okay.",
            "That's helpful."
        ]

        // Pick a random one to sound natural
        return acknowledgments[Math.floor(Math.random() * acknowledgments.length)]
    }
}
