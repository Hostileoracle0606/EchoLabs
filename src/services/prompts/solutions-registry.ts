import fs from 'fs'
import path from 'path'

export interface IntentDefinition {
  id: string
  triggers: string[]
  philosophy: string
  discoveryQuestion: string
  whyThisMatters: string
}

export interface CheckboxDefinition {
  key: string
  weight: number // 1.0 = critical, 0.7 = important, 0.3 = nice-to-have
  question: string
  extraction: string
  description: string
}

export interface IntentTemplates {
  summary: string
  proposal: string
}

/**
 * SolutionsRegistry
 * Parses and provides access to intent definitions from SOLUTIONS.md
 * Central registry for all solution intents, checkboxes, and templates
 */
export class SolutionsRegistry {
  private intents: Map<string, IntentDefinition> = new Map()
  private checkboxes: Map<string, CheckboxDefinition[]> = new Map()
  private templates: Map<string, IntentTemplates> = new Map()

  constructor(private solutionsPath: string) {
    this.loadSolutions()
  }

  /**
   * Load and parse SOLUTIONS.md file
   * This is a simplified parser - in production, you'd want more robust parsing
   */
  private loadSolutions(): void {
    // Define the intents based on SOLUTIONS.md structure
    // In a real implementation, you'd parse the markdown file
    
    // ECOSYSTEM_MAPPING_INQUIRY
    this.intents.set('ECOSYSTEM_MAPPING_INQUIRY', {
      id: 'ECOSYSTEM_MAPPING_INQUIRY',
      triggers: ['channel problems', 'lead quality', 'cross-channel', 'marketing inefficiency', 'conversion', 'channels'],
      philosophy: 'The ecosystem and the offer must align. Channels in silos are blind.',
      discoveryQuestion: 'What exists in the full ecosystem when leads go hot vs. cold?',
      whyThisMatters: 'Most prospects optimize channels individually and hemorrhage money in invisible cross-channel friction.'
    })

    this.checkboxes.set('ECOSYSTEM_MAPPING_INQUIRY', [
      // CRITICAL (1.0)
      {
        key: 'current_channels',
        weight: 1.0,
        question: 'Walk me through all the channels you\'re currently running. Which ones are active right now?',
        extraction: 'List of channels, any mention of "too many" or "spread thin"',
        description: 'Which marketing channels are they currently using?'
      },
      {
        key: 'lead_quality_variance',
        weight: 1.0,
        question: 'Have you noticed periods where leads are super engaged, then suddenly they go cold? What do you think changes between those periods?',
        extraction: 'Evidence of inconsistent lead quality, timing patterns',
        description: 'Do they see hot weeks vs. cold weeks?'
      },
      {
        key: 'current_pain_point',
        weight: 1.0,
        question: 'If you could wave a magic wand and fix one thing about your lead generation tomorrow, what would it be?',
        extraction: 'Specific pain (not generic "more leads")',
        description: 'What\'s the specific problem they\'re trying to solve RIGHT NOW?'
      },
      // IMPORTANT (0.7)
      {
        key: 'channel_coherence',
        weight: 0.7,
        question: 'If I looked at your LinkedIn ads, then your organic posts, then your emails—would I see the same message or different angles?',
        extraction: 'Coherence problems, messaging misalignment',
        description: 'Do their channels tell the same story or different stories?'
      },
      {
        key: 'current_metrics',
        weight: 0.7,
        question: 'What metrics do you look at right now to know if marketing is working?',
        extraction: 'Conversion rate, CTR, revenue (lagging) vs. reply time, message depth (predictive)',
        description: 'What are they currently measuring?'
      },
      {
        key: 'volume_vs_quality',
        weight: 0.7,
        question: 'Are you getting enough leads, just not the right ones? Or not enough leads period?',
        extraction: 'Volume problem vs. quality problem',
        description: 'Are they chasing volume or quality?'
      },
      // NICE-TO-HAVE (0.3)
      {
        key: 'team_size',
        weight: 0.3,
        question: 'Is this just you, or do you have a team helping with marketing and sales?',
        extraction: 'Team structure, bandwidth constraints',
        description: 'Who handles marketing and sales?'
      },
      {
        key: 'budget_range',
        weight: 0.3,
        question: 'What does your monthly marketing budget look like right now?',
        extraction: 'Budget level, willingness to invest',
        description: 'What have they invested in marketing so far?'
      },
      {
        key: 'timeline',
        weight: 0.3,
        question: 'Is this something you need to fix in the next 30 days, or are you exploring for later?',
        extraction: 'Urgency level',
        description: 'How urgent is solving this problem?'
      }
    ])

    this.templates.set('ECOSYSTEM_MAPPING_INQUIRY', {
      summary: 'Let me make sure I understand: You\'re running {current_channels}, and you\'re seeing {lead_quality_variance}. The biggest issue is {current_pain_point}. Your channels {channel_coherence status}, and you\'re currently tracking {current_metrics}. Is that accurate, or did I miss something important?',
      proposal: 'Based on what you\'ve shared, here\'s what I\'d suggest: We\'d start with ecosystem mapping—looking at what exists across all {current_channels} during your hot weeks vs. cold weeks. We\'d measure predictive signals like reply time, message depth, and hesitation points instead of just {current_metrics}. The goal is to find the invisible friction between channels that\'s causing {current_pain_point}. Does that sound like what would help?'
    })

    // Add more intents as needed...
    // VARIANT_TESTING_INQUIRY, OFFER_ARCHITECTURE_INQUIRY, etc.
  }

  /**
   * Get all available intents
   */
  getAllIntents(): IntentDefinition[] {
    return Array.from(this.intents.values())
  }

  /**
   * Get a specific intent by ID
   */
  getIntent(intentId: string): IntentDefinition | undefined {
    return this.intents.get(intentId)
  }

  /**
   * Get checkboxes for a specific intent
   */
  getCheckboxes(intentId: string): CheckboxDefinition[] {
    return this.checkboxes.get(intentId) || []
  }

  /**
   * Get summary template for a specific intent
   */
  getSummaryTemplate(intentId: string): string {
    return this.templates.get(intentId)?.summary || ''
  }

  /**
   * Get solution proposal template for a specific intent
   */
  getSolutionProposal(intentId: string): string {
    return this.templates.get(intentId)?.proposal || ''
  }

  /**
   * Get intent description (philosophy + why it matters)
   */
  getIntentDescription(intentId: string): string {
    const intent = this.intents.get(intentId)
    if (!intent) return ''
    return `${intent.philosophy} ${intent.whyThisMatters}`
  }

  /**
   * Classify intent based on triggers in transcript
   * Returns array of matching intents sorted by match score
   */
  classifyIntentByTriggers(transcript: string): Array<{intent: string, score: number}> {
    const transcriptLower = transcript.toLowerCase()
    const matches: Array<{intent: string, score: number}> = []

    for (const [intentId, intent] of this.intents.entries()) {
      let score = 0
      for (const trigger of intent.triggers) {
        if (transcriptLower.includes(trigger.toLowerCase())) {
          score++
        }
      }
      if (score > 0) {
        matches.push({ intent: intentId, score })
      }
    }

    return matches.sort((a, b) => b.score - a.score)
  }
}

// Singleton instance
let registryInstance: SolutionsRegistry | null = null

export function getSolutionsRegistry(): SolutionsRegistry {
  if (!registryInstance) {
    const solutionsPath = path.join(process.cwd(), 'prompts', 'SOLUTIONS.md')
    registryInstance = new SolutionsRegistry(solutionsPath)
  }
  return registryInstance
}
