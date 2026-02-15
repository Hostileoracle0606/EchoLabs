import { MastraWorkflow, WorkflowContext, WorkflowResult } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'
import { getSolutionsRegistry } from '@/services/prompts/solutions-registry'
import { getComplianceEngine } from '@/services/mastra/compliance-engine'

/**
 * Summary Generator Workflow
 * 
 * Purpose: Create structured summary of all discovered information and get customer validation
 * Trigger: Completeness score >= 0.8
 * 
 * Phases:
 * 1. Gather all checkbox data
 * 2. Load summary template  
 * 3. Build summary using template + checkbox data
 * 4. Validate via ComplianceEngine
 * 5. Present summary with confirmation question
 */
export class SummaryGeneratorWorkflow implements MastraWorkflow {
    private registry = getSolutionsRegistry()
    private compliance = getComplianceEngine()

    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { memory } = context
        const intentLock = memory.getIntentLock()

        if (!intentLock) {
            throw new Error('No intent locked - cannot generate summary')
        }

        // PHASE 1: Gather all checkbox data
        const checkboxes = memory.getCheckboxes()
        const checkboxData = this.formatCheckboxData(checkboxes)

        // PHASE 2: Load summary template
        const template = this.registry.getSummaryTemplate(intentLock.intent)

        if (!template) {
            return {
                response: this.generateGenericSummary(checkboxData),
                nextState: ConversationState.SUMMARY_REVIEW
            }
        }

        // PHASE 3: Build summary by filling template
        const summary = this.fillTemplate(template, checkboxData)

        // PHASE 4: Validate compliance
        const validation = this.compliance.validate(summary)

        if (!validation.compliant) {
            // Sanitize if there are violations
            const sanitized = this.compliance.sanitize(summary)
            return {
                response: sanitized,
                nextState: ConversationState.SUMMARY_REVIEW
            }
        }

        // PHASE 5: Return compliant summary
        return {
            response: summary,
            nextState: ConversationState.SUMMARY_REVIEW
        }
    }

    /**
     * Format checkbox data into a structured object
     */
    private formatCheckboxData(checkboxes: any[]): Record<string, any> {
        const data: Record<string, any> = {}

        for (const checkbox of checkboxes) {
            if (checkbox.completed) {
                data[checkbox.key] = checkbox.value
            }
        }

        return data
    }

    /**
     * Fill template with checkbox data
     */
    private fillTemplate(template: string, data: Record<string, any>): string {
        let filled = template

        // Replace {key} placeholders with actual values
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`\\{${key}\\}`, 'g')
            filled = filled.replace(placeholder, String(value))
        }

        // Handle status placeholders like {channel_coherence status}
        filled = filled.replace(/\{(\w+)\s+status\}/g, (match, key) => {
            const value = data[key]
            if (value) {
                // Determine status from value
                if (typeof value === 'string') {
                    if (value.toLowerCase().includes('misaligned')) return 'seem misaligned'
                    if (value.toLowerCase().includes('aligned')) return 'are aligned'
                    if (value.toLowerCase().includes('different')) return 'tell different stories'
                }
                return `are ${value}`
            }
            return 'need more info on'
        })

        // Clean up any remaining unfilled placeholders
        filled = filled.replace(/\{[^}]+\}/g, '[need more context]')

        return filled
    }

    /**
     * Generate generic summary when no template available
     */
    private generateGenericSummary(data: Record<string, any>): string {
        const points = Object.entries(data)
            .map(([key, value]) => `${this.keyToLabel(key)}: ${value}`)
            .join(', ')

        return `Let me make sure I understand: ${points}. Is that accurate, or did I miss something important?`
    }

    /**
     * Convert checkbox key to human-readable label
     */
    private keyToLabel(key: string): string {
        return key
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }
}
