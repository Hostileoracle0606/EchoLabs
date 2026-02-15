/**
 * ComplianceEngine
 * Validates LLM responses against RULES.md policy constraints
 * Ensures all responses are compliant before sending to customer
 */

export interface ComplianceViolation {
    type: 'over_promising' | 'guarantee' | 'misleading' | 'pushy' | 'pricing_without_context'
    message: string
    severity: 'low' | 'medium' | 'high'
}

export interface ValidationResult {
    compliant: boolean
    violations: ComplianceViolation[]
}

export class ComplianceEngine {
    // Patterns that indicate policy violations
    private readonly violationPatterns = {
        guarantees: [
            /\bguarantee\b/i,
            /\bpromise\b/i,
            /\bwill definitely\b/i,
            /\bwill 100%\b/i,
            /\byou will get\b/i
        ],
        overPromising: [
            /\bdouble your revenue\b/i,
            /\b10x your\b/i,
            /\bguaranteed results\b/i,
            /\bin just \d+ days\b/i,
            /\binstant results\b/i,
            /\bguaranteed roi\b/i
        ],
        pushy: [
            /\byou need to\b/i,
            /\byou should buy\b/i,
            /\bsign up now\b/i,
            /\blimited time\b/i,
            /\bact fast\b/i,
            /\bdon't miss out\b/i
        ],
        permissionBased: {
            // Should include permission-based language
            required: [
                /\bdoes that sound\b/i,
                /\bwould (?:that|it) help\b/i,
                /\bmake sense\b/i,
                /\bwant to explore\b/i,
                /\bwould you like\b/i,
                /\bis that\b/i
            ]
        }
    }

    /**
     * Validate a response against compliance rules
     */
    validate(response: string): ValidationResult {
        const violations: ComplianceViolation[] = []

        // Check for guarantees
        for (const pattern of this.violationPatterns.guarantees) {
            if (pattern.test(response)) {
                violations.push({
                    type: 'guarantee',
                    message: 'Response contains guarantee language which is prohibited',
                    severity: 'high'
                })
                break
            }
        }

        // Check for over-promising
        for (const pattern of this.violationPatterns.overPromising) {
            if (pattern.test(response)) {
                violations.push({
                    type: 'over_promising',
                    message: 'Response contains over-promising language',
                    severity: 'high'
                })
                break
            }
        }

        // Check for pushy language
        for (const pattern of this.violationPatterns.pushy) {
            if (pattern.test(response)) {
                violations.push({
                    type: 'pushy',
                    message: 'Response uses pushy sales tactics',
                    severity: 'medium'
                })
                break
            }
        }

        // Check for permission-based language in proposals
        // If response seems like a proposal (contains "suggest" or "recommend"), it should ask permission
        if (this.looksLikeProposal(response)) {
            const hasPermissionLanguage = this.violationPatterns.permissionBased.required.some(
                pattern => pattern.test(response)
            )
            if (!hasPermissionLanguage) {
                violations.push({
                    type: 'pushy',
                    message: 'Proposal does not use permission-based language',
                    severity: 'low'
                })
            }
        }

        return {
            compliant: violations.length === 0,
            violations
        }
    }

    /**
     * Check if response looks like a proposal that needs permission language
     */
    private looksLikeProposal(response: string): boolean {
        const proposalIndicators = [
            /\bsuggest\b/i,
            /\brecommend\b/i,
            /\bhere's what\b/i,
            /\bwhat I'd\b/i,
            /\bhere's how\b/i
        ]
        return proposalIndicators.some(pattern => pattern.test(response))
    }

    /**
     * Get a compliance-safe version of a response by removing violations
     * (Simple implementation - in production you'd regenerate with constraints)
     */
    sanitize(response: string): string {
        let sanitized = response

        // Remove guarantee language
        sanitized = sanitized.replace(/\bguarantee\b/gi, 'expect')
        sanitized = sanitized.replace(/\bpromise\b/gi, 'aim to')
        sanitized = sanitized.replace(/\bwill definitely\b/gi, 'will likely')

        // Add permission language if it's a proposal
        if (this.looksLikeProposal(sanitized) && !this.violationPatterns.permissionBased.required.some(p => p.test(sanitized))) {
            sanitized += ' Does that sound like what would help?'
        }

        return sanitized
    }
}

// Singleton instance
let engineInstance: ComplianceEngine | null = null

export function getComplianceEngine(): ComplianceEngine {
    if (!engineInstance) {
        engineInstance = new ComplianceEngine()
    }
    return engineInstance
}
