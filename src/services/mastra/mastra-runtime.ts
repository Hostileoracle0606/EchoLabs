import { WorkflowController } from '@/services/mastra/workflow-controller'
import { ThreadMemory } from '@/services/memory/thread-memory'
import { PromptBuilder } from '@/services/prompts/prompt-builder'
import { geminiGenerate } from '@/services/gemini/gemini.client'
import {
  getComplianceEngine,
  type ComplianceContext,
  type ComplianceViolation
} from '@/services/mastra/compliance-engine'
import { broadcast } from '@/websocket/ws-server'
import { ConversationState } from '@/types/conversation-state'
import type { TranscriptSpeaker } from '@/types/transcript'
import type { SalesSignalEnvelope } from '@/types/sales'
import type { MastraWorkflow } from '@/types/mastra-workflow'
import {
  IntentRouterWorkflow,
  IntentConfirmationWorkflow,
  SolutionExplorerWorkflow,
  SummaryGeneratorWorkflow,
  ObjectionHandlerWorkflow,
  SolutionProposalWorkflow,
  ConversationRepairWorkflow
} from '@/services/mastra/workflows'

export interface MastraConversationInput {
  sessionId: string
  callId?: string
  text: string
  speaker?: TranscriptSpeaker
  timestamp?: number
}

export interface MastraConversationOutput {
  response: string
}

type SessionRuntime = {
  memory: ThreadMemory
  controller: WorkflowController
}

export class MastraConversationRuntime {
  private sessions = new Map<string, SessionRuntime>()
  private promptBuilder = new PromptBuilder()
  private promptInit: Promise<void> | null = null
  private compliance = getComplianceEngine()

  private async ensurePromptBuilder(): Promise<void> {
    if (!this.promptInit) {
      this.promptInit = this.promptBuilder.initialize()
    }
    await this.promptInit
  }

  private getSession(sessionId: string): SessionRuntime {
    const existing = this.sessions.get(sessionId)
    if (existing) return existing

    const memory = new ThreadMemory(sessionId)
    const controller = new WorkflowController(memory, this.createWorkflowMap())
    const runtime = { memory, controller }
    this.sessions.set(sessionId, runtime)
    return runtime
  }

  private createWorkflowMap(): Map<ConversationState, MastraWorkflow> {
    return new Map([
      [ConversationState.INTENT_DETECTION, new IntentRouterWorkflow()],
      [ConversationState.INTENT_CONFIRMATION, new IntentConfirmationWorkflow()],
      [ConversationState.SOLUTION_EXPLORATION, new SolutionExplorerWorkflow()],
      [ConversationState.SUMMARY_REVIEW, new SummaryGeneratorWorkflow()],
      [ConversationState.OBJECTION_HANDLING, new ObjectionHandlerWorkflow()],
      [ConversationState.INTENT_RESOLUTION, new SolutionProposalWorkflow()],
      [ConversationState.CONVERSATION_REPAIR, new ConversationRepairWorkflow()]
    ])
  }

  async processTranscript(input: MastraConversationInput): Promise<MastraConversationOutput> {
    const {
      sessionId,
      callId: rawCallId,
      text,
      speaker = 'customer',
      timestamp
    } = input

    const callId = rawCallId ?? `call-${sessionId}`
    const session = this.getSession(sessionId)
    const memory = session.memory
    const isUser = speaker !== 'agent'

    if (!isUser) {
      return { response: '' }
    }

    memory.addMessage({
      role: isUser ? 'user' : 'assistant',
      content: text,
      timestamp: timestamp ?? Date.now()
    })

    let workflowResponse = ''
    if (isUser) {
      const result = await session.controller.processTranscript(text)
      workflowResponse = result.response || ''
    }

    await this.ensurePromptBuilder()

    const workflowName = session.controller.getCurrentState()
    let prompt = await this.promptBuilder.buildPrompt({
      workflow: workflowName,
      memory
    })

    if (workflowResponse) {
      prompt += `\n\n# WORKFLOW DRAFT RESPONSE\n${workflowResponse}\nUse this draft only if it helps.`
    }

    const context: ComplianceContext = {
      state: memory.getCurrentState(),
      completionScore: memory.getCompletionScore(),
      intentLocked: Boolean(memory.getIntentLock()),
      lastUserMessage: isUser ? text : undefined,
      workflow: workflowName
    }

    const preValidation = this.compliance.validatePre(context)
    if (!preValidation.compliant) {
      this.emitComplianceWarnings(sessionId, callId, preValidation.violations, 'agent')
      const notes = preValidation.violations.map((v) => `- ${v.message}`).join('\n')
      prompt += `\n\n# COMPLIANCE CONSTRAINTS\n${notes}\nRespond in a compliant way.`
    }

    let responseText = workflowResponse || 'Can you tell me a bit more about that?'
    try {
      responseText = await geminiGenerate({
        systemPrompt: 'You are a sales assistant. Follow the prompt exactly.',
        userPrompt: prompt
      })
    } catch (error) {
      console.error('[MastraConversationRuntime] LLM generation failed:', error)
    }

    const postValidation = this.compliance.validatePost(responseText, context)
    if (!postValidation.compliant) {
      // Log initial violations
      this.emitComplianceWarnings(sessionId, callId, postValidation.violations, 'agent')

      const needsRetry = postValidation.violations.some(v => v.severity !== 'low')
      if (needsRetry) {
        const violationNotes = postValidation.violations.map(v => `- ${v.message}`).join('\n')
        const retryPrompt = `${prompt}\n\n# COMPLIANCE VIOLATIONS\n${violationNotes}\nRegenerate a compliant response.`

        try {
          responseText = await geminiGenerate({
            systemPrompt: 'You are a sales assistant. Follow the prompt exactly.',
            userPrompt: retryPrompt
          })
        } catch (error) {
          console.error('[MastraConversationRuntime] LLM regeneration failed:', error)
        }
      }

      const retryValidation = this.compliance.validatePost(responseText, context)
      if (!retryValidation.compliant) {
        // Emit again if violations persist after retry
        this.emitComplianceWarnings(sessionId, callId, retryValidation.violations, 'agent')
        responseText = this.compliance.sanitize(responseText, context)
      }
    }

    memory.addMessage({
      role: 'assistant',
      content: responseText,
      timestamp: Date.now()
    })

    return { response: responseText }
  }

  private emitComplianceWarnings(
    sessionId: string,
    callId: string,
    violations: ComplianceViolation[],
    speaker: TranscriptSpeaker
  ) {
    if (violations.length === 0) return
    const warnings = this.compliance.toWarnings(violations, speaker)
    const envelope: SalesSignalEnvelope = {
      schemaVersion: 2,
      sessionId,
      callId
    }
    broadcast('sales:compliance', sessionId, { ...envelope, warnings })
  }
}

const globalForMastraConversation = global as unknown as { mastraConversationRuntime?: MastraConversationRuntime }

export function getMastraConversationRuntime(): MastraConversationRuntime {
  if (!globalForMastraConversation.mastraConversationRuntime) {
    globalForMastraConversation.mastraConversationRuntime = new MastraConversationRuntime()
  }
  return globalForMastraConversation.mastraConversationRuntime
}
