import type { ComplianceWarning } from '@/types/sales';
import type { TranscriptSpeaker } from '@/types/transcript';

const COMPLIANCE_RULES = [
  {
    id: 'no-guarantees',
    pattern: /\b(guarantee|guaranteed|100% sure|certainly)\b/i,
    severity: 'warning',
    message: 'Avoid absolute guarantees; soften with probabilities or references.',
  },
  {
    id: 'pricing-approval',
    pattern: /\b(discount|special price|price drop)\b/i,
    severity: 'warning',
    message: 'Pricing concessions require approval before committing.',
  },
  {
    id: 'legal-claims',
    pattern: /\b(legally binding|certified|compliant)\b/i,
    severity: 'critical',
    message: 'Legal/compliance claims must be verified with legal team.',
  },
];

export class ComplianceEngine {
  evaluate(text: string, speaker: TranscriptSpeaker): ComplianceWarning[] {
    const warnings: ComplianceWarning[] = [];
    const timestamp = Date.now();

    for (const rule of COMPLIANCE_RULES) {
      if (rule.pattern.test(text)) {
        warnings.push({
          id: `warning-${timestamp}-${Math.random().toString(36).slice(2, 6)}`,
          ruleId: rule.id,
          text: rule.message,
          severity: rule.severity as ComplianceWarning['severity'],
          detectedAt: timestamp,
          speaker,
        });
      }
    }

    return warnings;
  }
}
