import { MastraWorkflow, WorkflowContext, WorkflowResult } from '@/types/mastra-workflow'
import { ConversationState } from '@/types/conversation-state'
import { getSolutionsRegistry } from '@/services/prompts/solutions-registry'
import { getComplianceEngine } from '@/services/mastra/compliance-engine'

/**
 * Solution Proposal Workflow
 * 
 * Purpose: Present tailored solution based on all discovered context
 * Trigger: Summary approved ready to propose solution
 * 
 * Phases:
 * 1. Load solution template
 * 2. Gather complete context (checkboxes + CLIENT.md)
 * 3. Build 5-part proposal structure
 * 4. Validate via ComplianceEngine
 * 5. Present proposal
 */
export class SolutionProposalWorkflow implements MastraWorkflow {
    private registry = getSolutionsRegistry()
    private compliance = getComplianceEngine()

    async execute(context: WorkflowContext): Promise<WorkflowResult> {
        const { memory } = context
        const intentLock = memory.getIntentLock()

        if (!intentLock) {
            throw new Error('No intent locked - cannot propose solution')
        }

        // PHASE 1: Load solution template
        const template = this.registry.getSolutionProposal(intentLock.intent)

        // PHASE 2: Gather complete context
        const checkboxes = memory.getCheckboxes()
        const checkboxData = this.formatCheckboxData(checkboxes)

        // PHASE 3: Build proposal
        const proposal = this.buildProposal(template, checkboxData, intentLock.intent)

        // PHASE 4: Validate compliance
        const validation = this.compliance.validate(proposal)

        if (!validation.compliant) {
            // Sanitize if needed
            const sanitized = this.compliance.sanitize(proposal)
            return {
                response: sanitized,
                nextState: ConversationState.INTENT_RESOLUTION
            }
        }

        // PHASE 5: Return proposal
        return {
            response: proposal,
            nextState: ConversationState.INTENT_RESOLUTION
        }
    }

    /**
     * Format checkbox data for template filling
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
     * Build complete proposal from template and data
     */
    private buildProposal(
        template: string,
        data: Record<string, any>,
        intentId: string
    ): string {
        // Fill template with checkbox data
        let proposal = template

        // Replace {key} placeholders
        for (const [key, value] of Object.entries(data)) {
            const placeholder = new RegExp(`\\{${key}\\}`, 'g')
            proposal = proposal.replace(placeholder, String(value))
        }

        // Clean up unfilled placeholders
        proposal = proposal.replace(/\{[^}]+\}/g, (match) => {
            // Keep some context for unfilled fields
            const key = match.slice(1, -1)
            return data[key] || `[${key}]`
        })

        // Ensure it has permission-based ending
        if (!this.hasPermissionEnding(proposal)) {
            proposal += ' Does that sound like what would help?'
        }

        return proposal
    }

    /**
     * Check if proposal has permission-based ending
     */
    private hasPermissionEnding(text: string): boolean {
        const permissionPatterns = [
            /does that sound/i,
            /make sense/i,
            /would that help/i,
            /sound like what/i
        ]

        return permissionPatterns.some(pattern => pattern.test(text))
    }
}
