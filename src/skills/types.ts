import type { WsEventType } from '@/types/events';
import type { Schema } from '@google/genai';

// ---------------------------------------------------------------------------
// AgentContext — shared mutable state for a single orchestration cycle
// ---------------------------------------------------------------------------

export interface SkillResult {
  skillName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  data: unknown;
  completedAt?: number;
  error?: string;
}

export interface AgentContext {
  /** Session this orchestration cycle belongs to */
  sessionId: string;

  /** The transcript chunk that triggered this cycle */
  transcriptText: string;

  /** Broader context (rolling transcript window, etc.) */
  fullContext: string;

  /**
   * Which skills Gemini decided to invoke in this cycle.
   * Populated BEFORE any skill starts executing so every
   * skill can see its siblings immediately.
   */
  invokedSkills: string[];

  /**
   * Results deposited by each skill as it completes.
   * Skills running in parallel can read this — if a faster
   * sibling already finished, its result is available here.
   */
  results: Map<string, SkillResult>;

  /**
   * Lightweight cross-skill scratchpad.
   * Convention: each skill writes namespaced keys, e.g.
   *   hints.summary_keyThemes = ['revenue', 'growth']
   *   hints.chart_title = 'Revenue Growth'
   * Other skills read these opportunistically (non-blocking).
   */
  hints: Record<string, unknown>;

  /** Timestamp when this orchestration cycle started */
  startedAt: number;

  /** Workspace-scoped Gemini key resolved at the route boundary */
  geminiApiKey?: string;
}

// ---------------------------------------------------------------------------
// SkillDefinition — the contract every skill module must export
// ---------------------------------------------------------------------------

export interface SkillDefinition {
  /** Must match the Gemini FunctionDeclaration name exactly */
  name: string;

  /** Instructional description — Gemini reads this to decide when to invoke */
  description: string;

  /** Parameter schema — uses the @google/genai Schema type directly for full compatibility */
  parameters: Schema;

  /**
   * Execute the skill.
   * @param args - The arguments Gemini provided in the functionCall
   * @param ctx  - Shared AgentContext for this orchestration cycle
   * @returns JSON-serializable result sent back as functionResponse
   */
  execute: (args: Record<string, unknown>, ctx: AgentContext) => Promise<unknown>;

  /** The WebSocket event this skill broadcasts on, or null if it doesn't broadcast */
  broadcastEvent: WsEventType | null;

  /**
   * Deterministic mock implementation for MOCK_MODE=true.
   * Must return without calling any external APIs.
   */
  mockExecute: (args: Record<string, unknown>, ctx: AgentContext) => Promise<unknown>;
}
