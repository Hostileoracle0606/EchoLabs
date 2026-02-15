import { MarkdownLoader } from './markdown-loader'
import { ThreadMemory, CheckboxState } from '@/services/memory/thread-memory'

export interface PromptBuildParams {
  workflow: string
  memory: ThreadMemory
  clientContext?: string
}

/**
 * PromptBuilder
 * Dynamically assembles prompts from markdown files + runtime context
 */
export class PromptBuilder {
  private loader: MarkdownLoader
  private startupCache: Map<string, string> = new Map()

  constructor() {
    this.loader = new MarkdownLoader()
  }

  /**
   * Initialize - Load base prompts once at startup
   * Call this when application starts
   */
  async initialize(): Promise<void> {
    const basePrompts = ['AGENT', 'IDENTITY', 'RULES']

    for (const name of basePrompts) {
      const content = await this.loader.load(name)
      this.startupCache.set(name, content)
    }
  }

  /**
   * Build complete prompt for LLM
   */
  async buildPrompt(params: PromptBuildParams): Promise<string> {
    const { workflow, memory, clientContext } = params

    // Get base prompts from startup cache
    const agent = this.startupCache.get('AGENT') || ''
    const identity = this.startupCache.get('IDENTITY') || ''
    const rules = this.startupCache.get('RULES') || ''

    // Load workflow-specific template from SOLUTIONS.md
    const workflowTemplate = await this.loadWorkflowTemplate(workflow)

    // Load CLIENT.md if available
    const clientMd = clientContext || await this.loadClientMd()

    // Get conversation history
    const conversationHistory = memory.getRecentContext(10)

    // Get checkbox state
    const checkboxes = memory.getCheckboxes()
    const checkboxSummary = this.formatCheckboxes(checkboxes)

    // Assemble final prompt
    return this.assemblePrompt({
      agent,
      identity,
      rules,
      workflowTemplate,
      clientMd,
      conversationHistory,
      checkboxSummary,
      currentState: memory.getCurrentState()
    })
  }

  /**
   * Load workflow-specific template from SOLUTIONS.md
   */
  private async loadWorkflowTemplate(workflow: string): Promise<string> {
    const solutionsContent = await this.loader.load('SOLUTIONS')
    // For now, return full content
    // In production, extract specific intent section based on workflow
    return solutionsContent
  }

  /**
   * Load CLIENT.md (or return default if not available)
   */
  private async loadClientMd(): Promise<string> {
    try {
      return await this.loader.load('CLIENT')
    } catch {
      return '# CLIENT CONTEXT\n\nNo client data available.'
    }
  }

  /**
   * Format checkboxes for prompt injection
   */
  private formatCheckboxes(checkboxes: CheckboxState[]): string {
    if (checkboxes.length === 0) {
      return 'No checkboxes completed yet.'
    }

    return checkboxes
      .map(cb => `- [${cb.completed ? 'x' : ' '}] ${cb.key}: ${cb.value || 'pending'}`)
      .join('\n')
  }

  /**
   * Assemble final prompt from all components
   */
  private assemblePrompt(parts: {
    agent: string
    identity: string
    rules: string
    workflowTemplate: string
    clientMd: string
    conversationHistory: string
    checkboxSummary: string
    currentState: string
  }): string {
    return `
# AGENT INSTRUCTIONS
${parts.agent}

# YOUR IDENTITY
${parts.identity}

# COMPLIANCE RULES
${parts.rules}

# CLIENT CONTEXT
${parts.clientMd}

# CURRENT WORKFLOW
State: ${parts.currentState}
${parts.workflowTemplate}

# DISCOVERY PROGRESS
${parts.checkboxSummary}

# CONVERSATION HISTORY
${parts.conversationHistory}

# YOUR TASK
Based on the above context, generate your next response to continue the conversation naturally.
`.trim()
  }
}
