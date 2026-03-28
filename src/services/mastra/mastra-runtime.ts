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
  lastActive: number
}

const DEFAULT_SESSION_TTL_MS = 30 * 60 * 1000
const DEFAULT_SESSION_CLEANUP_MS = 5 * 60 * 1000
const DEFAULT_LLM_CONCURRENCY = 2
const DEFAULT_MAX_QUEUE_DEPTH = 100
const DEFAULT_MAX_SESSION_QUEUE_DEPTH = 20

class ConcurrencyGate {
  private active = 0
  private queue: Array<() => void> = []

  constructor(private limit: number) { }

  async acquire(): Promise<() => void> {
    if (this.active < this.limit) {
      this.active += 1
      return () => this.release()
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active += 1
        resolve(() => this.release())
      })
    })
  }

  private release(): void {
    this.active = Math.max(0, this.active - 1)
    const next = this.queue.shift()
    if (next) next()
  }
}


export class MastraConversationRuntime {
  private sessions = new Map<string, SessionRuntime>()
  private sessionQueues = new Map<string, Promise<void>>()
  private sessionQueueDepth = new Map<string, number>()
  private pendingTasks = 0
  private maxQueueDepth =
    Number.parseInt(process.env.MASTRA_MAX_QUEUE_DEPTH ?? '', 10) || DEFAULT_MAX_QUEUE_DEPTH
  private maxSessionQueueDepth =
    Number.parseInt(process.env.MASTRA_MAX_SESSION_QUEUE_DEPTH ?? '', 10) || DEFAULT_MAX_SESSION_QUEUE_DEPTH
  private promptBuilder = new PromptBuilder()
  private promptInit: Promise<void> | null = null
  private compliance = getComplianceEngine()
  private cleanupInterval: NodeJS.Timeout | null = null
  private sessionTtlMs =
    Number.parseInt(process.env.MASTRA_SESSION_TTL_MS ?? '', 10) || DEFAULT_SESSION_TTL_MS
  private cleanupIntervalMs =
    Number.parseInt(process.env.MASTRA_SESSION_CLEANUP_MS ?? '', 10) || DEFAULT_SESSION_CLEANUP_MS
  private static llmGate = new ConcurrencyGate(
    Number.parseInt(process.env.MASTRA_LLM_CONCURRENCY ?? '', 10) || DEFAULT_LLM_CONCURRENCY
  )

  constructor() {
    this.startCleanupLoop()
  }

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
    const runtime = { memory, controller, lastActive: Date.now() }
    this.sessions.set(sessionId, runtime)
    return runtime
  }

  private createWorkflowMap(): Map<ConversationState, MastraWorkflow> {
    const workflows: Array<[ConversationState, MastraWorkflow]> = [
      [ConversationState.INTENT_DETECTION, new IntentRouterWorkflow()],
      [ConversationState.INTENT_CONFIRMATION, new IntentConfirmationWorkflow()],
      [ConversationState.SOLUTION_EXPLORATION, new SolutionExplorerWorkflow()],
      [ConversationState.SUMMARY_REVIEW, new SummaryGeneratorWorkflow()],
      [ConversationState.OBJECTION_HANDLING, new ObjectionHandlerWorkflow()],
      [ConversationState.INTENT_RESOLUTION, new SolutionProposalWorkflow()],
      [ConversationState.CONVERSATION_REPAIR, new ConversationRepairWorkflow()]
    ]

    return new Map(workflows)
  }

  async processTranscript(input: MastraConversationInput): Promise<MastraConversationOutput> {
    if (input.speaker === 'agent') {
      return { response: '' }
    }

    if (this.pendingTasks >= this.maxQueueDepth) {
      console.warn('[MastraConversationRuntime] Queue depth limit reached, dropping request.', {
        pendingTasks: this.pendingTasks,
        maxQueueDepth: this.maxQueueDepth,
        sessionId: input.sessionId
      })
      return { response: '' }
    }

    return this.enqueue(input.sessionId, async () => this.processTranscriptInternal(input))
  }

  async closeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
    this.sessionQueues.delete(sessionId)
  }

  private async processTranscriptInternal(input: MastraConversationInput): Promise<MastraConversationOutput> {
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

    this.touchSession(sessionId)

    memory.addMessage({
      role: isUser ? 'user' : 'assistant',
      content: text,
      timestamp: timestamp ?? Date.now()
    })

    let workflowResponse = ''
    if (isUser) {
      const result = await session.controller.processTranscript(text)
      workflowResponse = result || ''
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
      responseText = await this.generateWithGate({
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
          responseText = await this.generateWithGate({
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

  private async generateWithGate(params: { systemPrompt: string; userPrompt: string }): Promise<string> {
    const release = await MastraConversationRuntime.llmGate.acquire()
    try {
      return await geminiGenerate(params)
    } finally {
      release()
    }
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

  private enqueue<T>(sessionId: string, task: () => Promise<T>): Promise<T> {
    const previous = this.sessionQueues.get(sessionId) ?? Promise.resolve()
    const currentDepth = (this.sessionQueueDepth.get(sessionId) ?? 0) + 1
    this.sessionQueueDepth.set(sessionId, currentDepth)
    this.pendingTasks += 1

    if (currentDepth > this.maxSessionQueueDepth) {
      console.warn('[MastraConversationRuntime] Session queue depth high.', {
        sessionId,
        depth: currentDepth,
        maxSessionQueueDepth: this.maxSessionQueueDepth
      })
    }

    const run = async () => {
      try {
        return await task()
      } finally {
        this.pendingTasks = Math.max(0, this.pendingTasks - 1)
        const nextDepth = Math.max(0, (this.sessionQueueDepth.get(sessionId) ?? 1) - 1)
        if (nextDepth === 0) {
          this.sessionQueueDepth.delete(sessionId)
        } else {
          this.sessionQueueDepth.set(sessionId, nextDepth)
        }
      }
    }

    const next = previous.then(run, run)
    this.sessionQueues.set(sessionId, next.then(() => { }, () => { }))
    return next
  }

  private touchSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActive = Date.now()
    }
  }

  private startCleanupLoop(): void {
    if (this.cleanupInterval) return
    if (this.sessionTtlMs <= 0) return

    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [sessionId, session] of this.sessions.entries()) {
        if (now - session.lastActive > this.sessionTtlMs) {
          this.sessions.delete(sessionId)
          this.sessionQueues.delete(sessionId)
        }
      }
    }, this.cleanupIntervalMs)
  }
}

const globalForMastraConversation = global as unknown as { mastraConversationRuntime?: MastraConversationRuntime }

export function getMastraConversationRuntime(): MastraConversationRuntime {
  if (!globalForMastraConversation.mastraConversationRuntime) {
    globalForMastraConversation.mastraConversationRuntime = new MastraConversationRuntime()
  }
  return globalForMastraConversation.mastraConversationRuntime
}
