import type { ComplianceWarning } from '@/types/sales';
import type { TranscriptSpeaker } from '@/types/transcript';
import { getComplianceEngine } from '@/services/mastra/compliance-engine';

// Legacy wrapper retained for backward compatibility with Sales Orchestrator.
export class ComplianceEngine {
  evaluate(text: string, speaker: TranscriptSpeaker): ComplianceWarning[] {
    const engine = getComplianceEngine();
    const result = engine.validatePost(text);
    return engine.toWarnings(result.violations, speaker);
  }
}
