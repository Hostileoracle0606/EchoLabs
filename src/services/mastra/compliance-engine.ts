/**
 * ComplianceEngine
 * Validates LLM responses against RULES.md policy constraints
 * Ensures all responses are compliant before sending to customer
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { ComplianceWarning } from '@/types/sales'
import type { TranscriptSpeaker } from '@/types/transcript'
import { ConversationState } from '@/types/conversation-state'

export interface ComplianceContext {
    state: ConversationState
    completionScore: number
    intentLocked: boolean
    lastUserMessage?: string
    workflow?: string
}

export interface ComplianceViolation {
    type:
        | 'over_promising'
        | 'guarantee'
        | 'misleading'
        | 'pushy'
        | 'pricing_without_context'
        | 'premature_pitch'
        | 'premature_summary'
        | 'missing_intent_lock'
        | 'forbidden_phrase'
        | 'permission_missing'
        | 'meaning_over_literal'
    message: string
    severity: 'low' | 'medium' | 'high'
}

export interface ValidationResult {
    compliant: boolean
    violations: ComplianceViolation[]
}

export class ComplianceEngine {
    private rulesText: string = ''
    private parsedRules: Array<{ id: string; title: string }> = []
    private promptText: string = ''
    private forbiddenPhrases: string[] = []
    private forbiddenPatterns: RegExp[] = []

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
        directiveClose: [
            /\blet's schedule\b/i,
            /\bi'll send you\b/i,
            /\bi'll put together\b/i,
            /\bthe next step is\b/i,
            /\bwe should\b/i
        ],
        pricing: [
            /\bpricing\b/i,
            /\bprice\b/i,
            /\bcost\b/i,
            /\bbudget\b/i,
            /\$\s?\d+/i
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
        },
        uncertainty: /\b(not sure|not certain|maybe|i (?:don't|do not) know|i'?m unsure|not ready|not really)\b/i,
        strongCommitment: /\b(absolutely|definitely|for sure|let's do it|we will|sounds great|perfect)\b/i,
        proposalIndicators: [
            /\b(?:i|we)\s+(?:suggest|recommend)\b/i,
            /\bmy recommendation\b/i,
            /\bmy proposal\b/i,
            /\bhere's what i(?:'d| would) suggest\b/i,
            /\bhere's what i(?:'d| would) recommend\b/i,
            /\bhere's a proposal\b/i
        ]
    }

    constructor() {
        this.loadRules()
        this.loadPrompt()
    }

    /**
     * Load RULES.md for reference and future parsing.
     */
    private loadRules(): void {
        try {
            const filePath = join(process.cwd(), 'prompts', 'RULES.md')
            this.rulesText = readFileSync(filePath, 'utf-8').trim()
        } catch {
            this.rulesText = ''
        }
        this.parsedRules = this.parseRules(this.rulesText)
    }

    private loadPrompt(): void {
        try {
            const filePath = join(process.cwd(), 'prompts', 'PROMPT.md')
            this.promptText = readFileSync(filePath, 'utf-8').trim()
        } catch {
            this.promptText = ''
        }

        const parsed = this.parseForbiddenPhrases(this.promptText)
        this.forbiddenPhrases = parsed.length > 0 ? parsed : this.getDefaultForbiddenPhrases()
        this.forbiddenPatterns = this.forbiddenPhrases.map((phrase) => new RegExp(this.escapeRegExp(phrase), 'i'))
    }

    /**
     * Allow hot reload of RULES.md (useful in tests/dev).
     */
    reload(): void {
        this.loadRules()
        this.loadPrompt()
    }

    getRulesText(): string {
        return this.rulesText
    }

    getParsedRules(): Array<{ id: string; title: string }> {
        return [...this.parsedRules]
    }

    getPromptText(): string {
        return this.promptText
    }

    /**
     * Pre-generation validation (context-based).
     */
    validatePre(context: ComplianceContext): ValidationResult {
        const violations: ComplianceViolation[] = []

        if (!context.intentLocked && context.state !== ConversationState.INTENT_DETECTION) {
            violations.push({
                type: 'missing_intent_lock',
                message: 'Intent must be confirmed before advancing state.',
                severity: 'medium'
            })
        }

        if (context.state === ConversationState.INTENT_RESOLUTION && context.completionScore < 0.8) {
            violations.push({
                type: 'premature_pitch',
                message: 'Proposal requested before discovery is sufficiently complete.',
                severity: 'medium'
            })
        }

        if (context.state === ConversationState.SUMMARY_REVIEW && context.completionScore < 0.6) {
            violations.push({
                type: 'premature_summary',
                message: 'Summary requested before discovery is sufficiently complete.',
                severity: 'low'
            })
        }

        return {
            compliant: violations.length === 0,
            violations
        }
    }

    /**
     * Validate a response against compliance rules
     */
    validate(response: string, context?: ComplianceContext): ValidationResult {
        return this.validatePost(response, context)
    }

    /**
     * Post-generation validation (response-based).
     */
    validatePost(response: string, context?: ComplianceContext): ValidationResult {
        const violations: ComplianceViolation[] = []

        // Forbidden phrases from PROMPT.md
        for (const pattern of this.forbiddenPatterns) {
            if (pattern.test(response)) {
                violations.push({
                    type: 'forbidden_phrase',
                    message: 'Response contains a forbidden phrase.',
                    severity: 'high'
                })
                break
            }
        }

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

        // Check for directive closes without permission language
        if (this.violationPatterns.directiveClose.some(p => p.test(response))) {
            const hasPermissionLanguage = this.violationPatterns.permissionBased.required.some(
                pattern => pattern.test(response)
            )
            if (!hasPermissionLanguage) {
                violations.push({
                    type: 'permission_missing',
                    message: 'Response suggests next steps without explicit permission language.',
                    severity: 'medium'
                })
            }
        }

        // Check for pricing without context
        if (context?.completionScore !== undefined && context.completionScore < 0.5) {
            for (const pattern of this.violationPatterns.pricing) {
                if (pattern.test(response)) {
                    violations.push({
                        type: 'pricing_without_context',
                        message: 'Pricing mentioned before enough discovery context was gathered.',
                        severity: 'medium'
                    })
                    break
                }
            }
        }

        // Check for premature pitching based on completion score + state
        if (
            context?.completionScore !== undefined &&
            context.completionScore < 0.6 &&
            context.state !== ConversationState.INTENT_RESOLUTION
        ) {
            if (this.violationPatterns.proposalIndicators.some(p => p.test(response))) {
                violations.push({
                    type: 'premature_pitch',
                    message: 'Proposal language used before discovery is sufficiently complete.',
                    severity: 'medium'
                })
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
                    type: 'permission_missing',
                    message: 'Proposal does not use permission-based language',
                    severity: 'low'
                })
            }
        }

        // Meaning over literal compliance (heuristic)
        if (context?.lastUserMessage && this.violationPatterns.uncertainty.test(context.lastUserMessage)) {
            if (this.violationPatterns.strongCommitment.test(response)) {
                violations.push({
                    type: 'meaning_over_literal',
                    message: 'Response assumes commitment despite user uncertainty.',
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
        return this.violationPatterns.proposalIndicators.some(pattern => pattern.test(response))
    }

    /**
     * Map violations into UI-friendly warnings.
     */
    toWarnings(violations: ComplianceViolation[], speaker: TranscriptSpeaker): ComplianceWarning[] {
        const detectedAt = Date.now()
        return violations.map((violation) => ({
            id: `warning-${detectedAt}-${Math.random().toString(36).slice(2, 6)}`,
            ruleId: violation.type,
            text: violation.message,
            severity: this.mapSeverity(violation.severity),
            detectedAt,
            speaker
        }))
    }

    private mapSeverity(severity: ComplianceViolation['severity']): ComplianceWarning['severity'] {
        if (severity === 'high') return 'critical'
        if (severity === 'medium') return 'warning'
        return 'info'
    }

    /**
     * Get a compliance-safe version of a response by removing violations
     * (Simple implementation - in production you'd regenerate with constraints)
     */
    sanitize(response: string, context?: ComplianceContext): string {
        let sanitized = response

        // Remove forbidden phrases
        for (const pattern of this.forbiddenPatterns) {
            sanitized = sanitized.replace(pattern, '')
        }

        // Remove guarantee language
        sanitized = sanitized.replace(/\bguarantee\b/gi, 'expect')
        sanitized = sanitized.replace(/\bpromise\b/gi, 'aim to')
        sanitized = sanitized.replace(/\bwill definitely\b/gi, 'will likely')

        // Add permission language if it's a proposal
        if (this.looksLikeProposal(sanitized) && !this.violationPatterns.permissionBased.required.some(p => p.test(sanitized))) {
            sanitized += ' Does that sound like what would help?'
        }

        // Add permission language if next-step directive detected
        if (this.violationPatterns.directiveClose.some(p => p.test(sanitized)) && !this.violationPatterns.permissionBased.required.some(p => p.test(sanitized))) {
            sanitized += ' Would that make sense?'
        }

        // If pricing was mentioned too early, soften with a qualifier
        if (context?.completionScore !== undefined && context.completionScore < 0.5 && this.violationPatterns.pricing.some(p => p.test(sanitized))) {
            sanitized += ' Happy to talk pricing once I understand a bit more about your context.'
        }

        return sanitized
    }

    private parseForbiddenPhrases(markdown: string): string[] {
        if (!markdown) return []
        const lines = markdown.split('\n')
        let inSection = false
        const phrases: string[] = []

        for (const rawLine of lines) {
            const line = rawLine.trim()
            if (line.toLowerCase().includes('forbidden phrases')) {
                inSection = true
                continue
            }

            if (inSection && line.startsWith('#')) {
                break
            }

            if (!inSection) continue
            if (!line.startsWith('-')) continue

            let phrase = line.replace(/^-+\s*/, '').trim()
            phrase = phrase.replace(/\s*\(.*\)\s*$/, '').trim()
            phrase = phrase.replace(/^["'`]+/, '').replace(/["'`]+$/, '').trim()
            phrase = phrase.replace(/[*_`]/g, '').trim()
            phrase = phrase.replace(/\.{3,}$/, '').trim()
            phrase = phrase.replace(/[.!]$/, '').trim()
            if (phrase.length > 0) phrases.push(phrase)
        }

        return phrases
    }

    private parseRules(markdown: string): Array<{ id: string; title: string }> {
        if (!markdown) return []
        const rules: Array<{ id: string; title: string }> = []
        const lines = markdown.split('\n')

        for (const rawLine of lines) {
            const line = rawLine.trim()
            const normalized = line.replace(/\\#/g, '#')
            if (!normalized.startsWith('##')) continue

            // Strip markdown and numbering: "## **1. NON-COERCION IS ABSOLUTE**"
            const cleaned = normalized
                .replace(/^##+\s*/, '')
                .replace(/\*\*/g, '')
                .replace(/^\d+\.\s*/, '')
                .trim()

            if (!cleaned) continue

            const id = cleaned
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')

            rules.push({ id, title: cleaned })
        }

        return rules
    }

    private getDefaultForbiddenPhrases(): string[] {
        return [
            'As an AI',
            'Let me process that',
            'Based on my training',
            "I don't have access to",
            "I'm just here to help",
            'Thank you for your patience',
            'To be honest'
        ]
    }

    private escapeRegExp(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
