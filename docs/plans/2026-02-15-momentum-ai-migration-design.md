# Momentum AI Migration Design
**Date:** 2026-02-15
**Type:** Architecture Migration
**Approach:** Clean Slate Migration (Approach 1)

---

## Executive Summary

This design document outlines the migration from the current Momentum AI architecture (refactor2 branch) to a unified, production-ready system following the master prompt specifications. The migration implements a **clean slate approach**, building a new architecture in the parent Momentum_AI directory while preserving the reference implementation in temp_momentum.

### Key Goals
1. Implement Mastra Runtime as the primary orchestrator (replacing Sales Orchestrator)
2. Consolidate to Smallest.ai as the single LLM provider (deprecating Gemini)
3. Create a prompt-driven architecture using markdown files (AGENT.md, IDENTITY.md, RULES.md, SOLUTIONS.md, CLIENT.md, PROMPT.md)
4. Extend Thread Memory with state machine capabilities
5. Build a checkbox-driven discovery system for structured sales conversations
6. Wire TTS output through Smallest.ai
7. Support Vapi as primary audio source (with browser mic fallback for development)

---

## Architecture Overview

### High-Level Component Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AUDIO INPUT LAYER                             │
│  ┌──────────────┐         ┌────────────────────┐                   │
│  │ Vapi         │────────▶│ Audio Source       │                   │
│  │ WebSocket    │         │ Adapter (NEW)      │                   │
│  └──────────────┘         └────────────────────┘                   │
│  ┌──────────────┐                  │                                │
│  │ Browser Mic  │──────────────────┘                                │
│  │ (Dev only)   │                                                   │
│  └──────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     VOICE PROCESSING LAYER                           │
│  ┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐  │
│  │ WebSocket    │───▶│ Voice Session   │───▶│ Smallest Voice   │  │
│  │ Server       │    │ Manager         │    │ Pipeline         │  │
│  └──────────────┘    └─────────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  MEMORY & STATE LAYER                                │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Extended Thread Memory (SINGLE SOURCE OF TRUTH)              │  │
│  │  ┌────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │  │
│  │  │ Conv       │ │ State       │ │ Checkbox Registry       │ │  │
│  │  │ History    │ │ Machine     │ │ (Discovery Progress)    │ │  │
│  │  └────────────┘ └─────────────┘ └─────────────────────────┘ │  │
│  │  ┌────────────┐ ┌─────────────┐                             │  │
│  │  │ Intent     │ │ Context     │                             │  │
│  │  │ Lock       │ │ Window      │                             │  │
│  │  └────────────┘ └─────────────┘                             │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Transcript Store (Persistence Layer)                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              ORCHESTRATION LAYER (MASTRA ONLY)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Mastra Runtime (PRIMARY ORCHESTRATOR)                        │  │
│  │  ├─ Workflow Controller (State Machine Driver)                │  │
│  │  ├─ Intent Router Workflow                                    │  │
│  │  ├─ Solution Explorer Workflow                                │  │
│  │  ├─ Summary Generator Workflow                                │  │
│  │  └─ Objection Handler Workflow                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│            PROMPT CONSTRUCTION LAYER (NEW)                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Prompt Builder Service                                       │  │
│  │  ┌──────────────────┐      ┌──────────────────────┐         │  │
│  │  │ Startup Cache    │      │ Runtime Context      │         │  │
│  │  │ (Load Once)      │      │ (Per-Turn Injection) │         │  │
│  │  │                  │      │                      │         │  │
│  │  │ • AGENT.md       │      │ • SOLUTIONS.md       │         │  │
│  │  │ • IDENTITY.md    │      │ • CLIENT.md          │         │  │
│  │  │ • RULES.md       │      │ • PROMPT.md          │         │  │
│  │  └──────────────────┘      └──────────────────────┘         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  COMPLIANCE LAYER                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Compliance Engine (Modified to load RULES.md)                │  │
│  │  Pre-validate prompts │ Post-validate responses               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 LLM LAYER (SMALLEST.AI ONLY)                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Smallest.ai Provider (Consolidated LLM calls)                │  │
│  │  Streaming Response (Sentence-buffered)                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│               AUDIO OUTPUT LAYER                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  TTS Synthesizer (Smallest.ai TTS)                            │  │
│  │          ▼                                                     │  │
│  │  Sentence Audio Buffer (NEW - Interruptible chunks)           │  │
│  │          ▼                                                     │  │
│  │  Audio stream → Vapi (or Browser Mic for dev)                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Interruption Handler (NEW - Detects customer barge-in)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Conversation State Machine

The system implements a rigorous state machine as defined in AGENT.md:

```
INTENT_DETECTION ──────▶ INTENT_CONFIRMATION
         ▲                        │
         │                        ▼
         │              SOLUTION_EXPLORATION ◀─┐
         │                        │             │
         │                        ▼             │
         │              SUMMARY_REVIEW          │
         │                        │             │
         │                        ├─────────────┘
         │                        │
         │                        ▼
         │              INTENT_RESOLUTION
         │                        │
         └────────────────────────┘

         (OBJECTION_HANDLING and CONVERSATION_REPAIR can be entered from any state)
```

### State Descriptions

1. **INTENT_DETECTION**: Classify customer's need against SOLUTIONS.md intent triggers
2. **INTENT_CONFIRMATION**: Confirm understanding before deep discovery
3. **SOLUTION_EXPLORATION**: Complete weighted checkboxes from SOLUTIONS.md
4. **SUMMARY_REVIEW**: Reflect understanding and confirm accuracy
5. **OBJECTION_HANDLING**: Address customer concerns and rebuild trust
6. **INTENT_RESOLUTION**: Provide solution/proposal and next steps
7. **CONVERSATION_REPAIR**: Re-sync understanding when confusion detected

---

## Component Design

### 1. Extended Thread Memory (src/services/memory/thread-memory.ts)

**Purpose**: Single source of truth for conversation state, history, and discovery progress.

**Extends Existing Implementation With**:
- **State Machine**: Track current conversation state, enforce valid transitions
- **Intent Lock**: Once confirmed, intent cannot drift without explicit customer correction
- **Checkbox Registry**: Weighted discovery items from SOLUTIONS.md
- **Completeness Scoring**: Calculate discovery progress (sum of weighted checkboxes)

**Key Methods**:
```typescript
lockIntent(intent: string, confidence: number): void
releaseIntent(): void
updateCheckbox(key: string, value: any, weight: number): void
getCompletionScore(): number  // 0.0 - 1.0
transitionState(newState: ConversationState): void
getCurrentState(): ConversationState
getCheckboxes(): CheckboxState[]
```

**State Transition Rules**:
- Valid transitions defined in `validTransitions` map
- Throws error if invalid transition attempted
- Updates CLIENT.md automatically on state change

---

### 2. Audio Source Adapter (src/services/voice/audio-source-adapter.ts)

**Purpose**: Unified interface for Vapi (production) and browser mic (development).

**Interface Design**:
```typescript
interface AudioSource {
  connect(): Promise<void>
  onAudioChunk(callback: (chunk: AudioChunk) => void): void
  onDisconnect(callback: () => void): void
  disconnect(): Promise<void>
}
```

**Implementations**:
- **VapiSource**: Connects to Vapi WebSocket/webhook, handles telephony audio
- **BrowserMicSource**: Existing browser mic WebSocket (dev only)

**Factory Pattern**:
```typescript
AudioSourceFactory.create('production')  // Returns VapiSource
AudioSourceFactory.create('development') // Returns BrowserMicSource
```

---

### 3. Workflow Controller (src/services/mastra/workflow-controller.ts)

**Purpose**: Routes transcripts to appropriate Mastra workflows based on current state.

**Responsibilities**:
1. Analyze current conversation state from Thread Memory
2. Select appropriate workflow (Intent Router, Solution Explorer, etc.)
3. Execute workflow with context (CLIENT.md, checkboxes, conversation history)
4. Handle workflow results (state transitions, checkbox updates, intent locks)
5. Update Thread Memory based on workflow output

**Workflow Registry**:
```typescript
Map<ConversationState, MastraWorkflow>
  INTENT_DETECTION → IntentRouterWorkflow
  INTENT_CONFIRMATION → IntentConfirmationWorkflow
  SOLUTION_EXPLORATION → SolutionExplorerWorkflow
  SUMMARY_REVIEW → SummaryGeneratorWorkflow
  OBJECTION_HANDLING → ObjectionHandlerWorkflow
  INTENT_RESOLUTION → SolutionProposalWorkflow
```

**Process Flow**:
```typescript
async processTranscript(transcript: string): Promise<string> {
  1. Get current state from ThreadMemory
  2. Get workflow for current state
  3. Execute workflow with context
  4. Handle state transitions
  5. Update checkboxes if returned
  6. Lock/unlock intent if detected
  7. Return generated response
}
```

---

### 4. Prompt Builder Service (src/services/prompts/prompt-builder.ts)

**Purpose**: Dynamically assemble prompts from markdown files + runtime context.

**Startup Cache** (Load once at application start):
- AGENT.md (orchestration logic)
- IDENTITY.md (voice & persona)
- RULES.md (compliance policies)

**Runtime Context** (Load per-turn):
- SOLUTIONS.md (specific intent's checkboxes)
- CLIENT.md (deal ledger - dynamically generated)
- PROMPT.md (response template directives)
- ThreadMemory (conversation history)
- Checkbox status

**Assembly Structure**:
```markdown
# AGENT INSTRUCTIONS
{AGENT.md content}

# YOUR IDENTITY
{IDENTITY.md content}

# COMPLIANCE RULES
{RULES.md content}

# CLIENT CONTEXT
{CLIENT.md content}

# CURRENT WORKFLOW
State: {current_state}
{SOLUTIONS.md - specific intent section}

# DISCOVERY PROGRESS
{formatted checkbox list with completion status}

# CONVERSATION HISTORY
{ThreadMemory.getRecentContext(10)}

# YOUR TASK
Based on the above context, generate your next response...
```

---

### 5. CLIENT.md Generator (src/services/crm/client-md-generator.ts)

**Purpose**: Generate CLIENT.md deal ledger from CRM data (or mock data for hackathon).

**Generation Trigger**: Call start (async pre-fetch while greeting plays)

**Template Sections** (from Client.md.docx):
1. CLIENT IDENTITY SNAPSHOT
2. STATED PROBLEM (Surface Narrative)
3. INFERRED CORE PROBLEM (Strategic Hypothesis)
4. CURRENT STATE METRICS
5. EMOTIONAL SIGNALS
6. BUYING SIGNALS
7. OBJECTIONS
8. CONSTRAINTS
9. DISCOVERY GAPS
10. STRATEGIC LEVERS
11. DEAL HEALTH (scored)
12. OPEN LOOPS
13. CONVERSATION HISTORY SNAPSHOT
14. LAST TRANSCRIPT ANALYSIS

**Update Strategy**:
- Sections 13 & 14 updated after EVERY transcript chunk
- Other sections updated when relevant data extracted
- Confidence scoring (low/medium/high) for hypotheses

---

### 6. Sentence Audio Buffer (src/services/voice/sentence-audio-buffer.ts)

**Purpose**: Buffer TTS output by sentence for natural, interruptible speech.

**Key Features**:
- Stream audio in sentence-sized chunks
- Support interruption mid-speech
- Clear remaining buffer on customer barge-in
- Natural pauses between sentences (100ms)

**Flow**:
```typescript
1. LLM streams response → TTS Synthesizer
2. TTS detects sentence boundary
3. Audio chunk added to buffer
4. Buffer plays chunks sequentially
5. If interruption detected:
   - Cancel current playback
   - Clear remaining buffer
   - Return control to customer
```

---

### 7. Interruption Handler (src/services/voice/interruption-handler.ts)

**Purpose**: Detect customer speech during agent TTS and handle gracefully.

**Detection**:
- Monitor audio input during TTS playback
- Detect voice activity above threshold
- Signal to Sentence Audio Buffer to cancel

**Context Update**:
- Store what was being said when interrupted
- Store customer's interruption content
- Classify interruption type (clarification, objection, excitement, correction, urgency)
- Update CLIENT.md section 5 (Emotional Signals)

**Workflow Routing**:
- Clarification → Answer and resume
- Objection → Route to Objection Handler
- Excitement → Let customer speak, incorporate insights
- Correction → Route to Conversation Repair
- Urgency → Accelerate to summary/next steps

---

## Markdown File Specifications

### AGENT.md (Orchestration Rules)
**Source**: /Users/trinabgoswamy/Downloads/AGENT.md
**Purpose**: Define decision-making logic for the LLM orchestrator
**Key Sections**:
- Core principle and responsibilities
- Decision flow architecture
- State machine definitions (7 states)
- Decision matrix (12 cases covering all scenarios)
- CLIENT.md update rules
- Workflow routing decisions
- Compliance checkpoints
- Performance metrics

**Load Frequency**: Once at startup, cached in Prompt Builder

---

### IDENTITY.md (Salesperson Persona)
**Source**: To be defined based on brand voice
**Purpose**: Define voice, tone, and personality of the AI agent
**Key Sections**:
- Voice characteristics (conversational, consultative, permission-based)
- Language patterns (questions over pitches, discovery over selling)
- Tone modulation (empathy for objections, excitement for buying signals)
- Prohibited behaviors (no pressure, no manipulation, no coercion)

**Load Frequency**: Once at startup, cached in Prompt Builder

---

### RULES.md (Compliance Policies)
**Source**: /Users/trinabgoswamy/Downloads/#1. CORE_RULES.md
**Purpose**: Immutable constraints that govern all interactions
**Key Principles**:
1. Non-coercion is absolute
2. Trust cannot be compensated for
3. Safety overrides optimization
4. Understanding precedes action
5. Meaning takes precedence over literal compliance
6. Permission is continuous, not binary
7. Long-term coherence overrides short-term gain
8. Invalidation & escalation protocol

**Load Frequency**: Once at startup, cached in Prompt Builder
**Enforcement**: Compliance Engine validates pre/post response generation

---

### SOLUTIONS.md (Checkbox-Driven Discovery)
**Source**: /Users/trinabgoswamy/Downloads/SOLUTIONS.md
**Purpose**: Define intents, discovery checkboxes, and solution templates
**Structure**:
- 6 Intent Types:
  1. ECOSYSTEM_MAPPING_INQUIRY
  2. VARIANT_TESTING_INQUIRY
  3. OFFER_ARCHITECTURE_INQUIRY
  4. PERMISSION_MARKETING_INQUIRY
  5. PRICING_INQUIRY
  6. GENERAL_INQUIRY

**Each Intent Contains**:
- Trigger keywords
- Philosophy
- Discovery question
- Weighted checkboxes (critical 1.0, important 0.7, nice-to-have 0.3)
- Discovery questions for each checkbox
- Summary template
- Solution proposal template

**Load Frequency**: Per-turn (specific intent section loaded based on locked intent)

---

### CLIENT.md (Deal Ledger - Dynamic)
**Source**: Template from /Users/trinabgoswamy/Downloads/Client.md.docx
**Purpose**: Living document updated throughout conversation
**Generation**: Async pre-fetch on call start from CRM (or mock data)
**Update Frequency**: After every transcript chunk (sections 13 & 14 always, others when relevant)

**14 Sections** (see CLIENT.md Generator design above)

---

### PROMPT.md (Response Directives)
**Purpose**: Template for LLM output structure and style
**Key Sections**:
- Response format (natural conversation, not robotic)
- Citation requirements (reference CLIENT.md sections when relevant)
- Question structure (open-ended for discovery, closed for confirmation)
- Length guidelines (concise, respect customer's time)
- Next-step framing (permission-based, not assumptive)

**Load Frequency**: Per-turn (runtime context)

---

## Data Flow: Complete User Journey

### Call Start
```
1. Customer calls → Vapi receives → Audio Source Adapter creates session
2. Parallel:
   a. Voice Session Manager → Greet customer (TTS: "Thanks for calling...")
   b. CRM Adapter → Generate CLIENT.md from mock/real data
3. ThreadMemory initialized:
   - State: INTENT_DETECTION
   - Intent: null
   - Checkboxes: empty
   - Conversation: []
```

### First Utterance: "Hi, I need pricing info"
```
1. Vapi → Audio Adapter → Smallest Pipeline → STT
2. Transcript: "Hi, I need pricing info"
3. Voice Session → ThreadMemory.addMessage()
4. Voice Session → Mastra Runtime.processTranscript()
5. Mastra Runtime → Workflow Controller
6. Workflow Controller:
   - Check state: INTENT_DETECTION
   - Route to: Intent Router Workflow
7. Intent Router Workflow:
   - Prompt Builder assembles:
     - AGENT.md (intent detection rules)
     - IDENTITY.md (voice)
     - RULES.md (compliance)
     - CLIENT.md (context)
     - ThreadMemory (conversation: ["Hi, I need pricing info"])
   - Send to Smallest.ai LLM
   - LLM analyzes → Intent: PRICING_INQUIRY (confidence: 0.94)
8. Intent Router returns:
   - detectedIntent: "PRICING_INQUIRY"
   - confidence: 0.94
   - nextState: INTENT_CONFIRMATION
9. Workflow Controller:
   - ThreadMemory.updateDetectedIntent()
   - ThreadMemory.transitionState(INTENT_CONFIRMATION)
   - Update CLIENT.md section 2 (Stated Problem: "pricing info")
10. Workflow Controller routes to Intent Confirmation Workflow
11. Intent Confirmation Workflow:
    - Prompt Builder assembles confirmation prompt
    - LLM generates: "I'd love to help with pricing. Just to confirm—are you looking for pricing for your team specifically, or for something else?"
12. Response → TTS Synthesizer → Sentence Audio Buffer → Vapi → Customer
13. ThreadMemory stores agent response
```

### Customer Confirms: "Yes, for about 50 users"
```
1. Transcript received: "Yes, for about 50 users"
2. Mastra Runtime → Workflow Controller
3. Workflow Controller:
   - Check state: INTENT_CONFIRMATION
   - Analyze response: Confirmation detected ("Yes")
   - Route to: Intent Confirmation Workflow (process confirmation)
4. Intent Confirmation Workflow:
   - Detects: Affirmative confirmation
   - Extracts: company_size = 50
   - Returns:
     - lockIntent: "PRICING_INQUIRY"
     - confidence: 0.94
     - extractedData: { company_size: 50 }
     - nextState: SOLUTION_EXPLORATION
5. Workflow Controller:
   - ThreadMemory.lockIntent("PRICING_INQUIRY", 0.94)
   - Load checkboxes from SOLUTIONS.md (PRICING_INQUIRY section)
   - ThreadMemory.updateCheckbox("company_size", 50, 1.0)
   - ThreadMemory.transitionState(SOLUTION_EXPLORATION)
   - Update CLIENT.md section 4 (Metrics: 50 users)
6. Workflow Controller routes to Solution Explorer Workflow
7. Solution Explorer Workflow:
   - Check completeness: 1/6 critical checkboxes = 0.17 (need more)
   - Identify next critical checkbox: revenue_baseline
   - Prompt Builder assembles discovery prompt
   - LLM generates: "Got it, 50 users. What does a typical client pay you right now, and how many clients do you take per month?"
8. Response → TTS → Buffer → Vapi → Customer
```

### Discovery Continues Until Completeness >= 0.8
```
(Multiple turns of SOLUTION_EXPLORATION)
Each turn:
1. Transcript received
2. Workflow Controller → Solution Explorer
3. Extract checkbox data
4. Update ThreadMemory and CLIENT.md
5. Calculate completeness score
6. IF score >= 0.8:
   - Transition to SUMMARY_REVIEW
   ELSE:
   - Ask next checkbox question
```

### Summary Review
```
1. State: SUMMARY_REVIEW
2. Workflow Controller → Summary Generator Workflow
3. Summary Generator:
   - Load all checkbox data
   - Load CLIENT.md (full context)
   - Load PROMPT.md (summary template)
   - Generate structured summary
4. Present summary → Customer
5. Customer response analyzed:
   - "That's spot on" → Transition to INTENT_RESOLUTION
   - "You missed X" → Transition back to SOLUTION_EXPLORATION
   - Objection raised → Transition to OBJECTION_HANDLING
```

### Intent Resolution (Proposal)
```
1. State: INTENT_RESOLUTION
2. Workflow Controller → Solution Proposal Workflow
3. Solution Proposal:
   - Load SOLUTIONS.md (solution template for PRICING_INQUIRY)
   - Load CLIENT.md (all context)
   - Build tailored proposal
4. Present proposal → Customer
5. Buying signal detected:
   - Update CLIENT.md section 6 (Buying Signals)
   - Update CLIENT.md section 11 (Deal Health: high)
   - Provide next steps
```

---

## Migration Checklist

### Phase 1: Foundation (Days 1-2)
- [ ] Copy working components from temp_momentum
  - [ ] WebSocket Server
  - [ ] Voice Session Manager
  - [ ] Smallest Voice Pipeline
  - [ ] Transcript Store
  - [ ] UI Store & Hooks
- [ ] Create markdown files in prompts/
  - [ ] AGENT.md (from provided file)
  - [ ] IDENTITY.md (draft salesperson persona)
  - [ ] RULES.md (from CORE_RULES.md)
  - [ ] SOLUTIONS.md (from provided file)
  - [ ] PROMPT.md (create response directives)
  - [ ] CLIENT.md (template from docx)
- [ ] Create Audio Source Adapter
  - [ ] Interface definition
  - [ ] VapiSource implementation
  - [ ] BrowserMicSource wrapper
  - [ ] Factory pattern
- [ ] Extend Thread Memory
  - [ ] Add ConversationState enum
  - [ ] Add CheckboxState interface
  - [ ] Add IntentLock interface
  - [ ] Implement state machine methods
  - [ ] Implement checkbox registry
  - [ ] Implement completeness scoring
- [ ] Create Markdown Loader
  - [ ] Read markdown files
  - [ ] Parse sections
  - [ ] Cache mechanism
- [ ] Create Prompt Builder Service
  - [ ] Startup cache (AGENT, IDENTITY, RULES)
  - [ ] Runtime context assembly
  - [ ] Template injection
  - [ ] Final prompt assembly

### Phase 2: Workflows (Days 2-3)
- [ ] Activate Mastra Runtime
  - [ ] Configure workflows
  - [ ] Setup tool integrations
- [ ] Implement Workflow Controller
  - [ ] State → Workflow routing
  - [ ] Context assembly
  - [ ] Result handling
  - [ ] State transitions
- [ ] Create Mastra Workflows
  - [ ] Intent Router Workflow
  - [ ] Intent Confirmation Workflow
  - [ ] Solution Explorer Workflow
  - [ ] Summary Generator Workflow
  - [ ] Objection Handler Workflow
  - [ ] Solution Proposal Workflow
- [ ] Modify Compliance Engine
  - [ ] Load RULES.md
  - [ ] Parse compliance rules
  - [ ] Pre-validation hook
  - [ ] Post-validation hook
- [ ] Integrate workflows with Thread Memory
  - [ ] Checkbox updates
  - [ ] State transitions
  - [ ] Intent locking

### Phase 3: Integration (Days 3-4)
- [ ] Wire TTS output
  - [ ] Smallest.ai TTS → Sentence Audio Buffer
  - [ ] Buffer → Vapi (production)
  - [ ] Buffer → Browser Mic (dev fallback)
- [ ] Create Sentence Audio Buffer
  - [ ] Sentence detection
  - [ ] Sequential playback
  - [ ] Interruption support
- [ ] Implement Interruption Handler
  - [ ] Voice activity detection during TTS
  - [ ] Buffer cancellation
  - [ ] Interruption type classification
  - [ ] Context update in CLIENT.md
- [ ] Create CLIENT.md Generator
  - [ ] Template loading
  - [ ] Mock data generation (for hackathon)
  - [ ] CRM integration stub
  - [ ] Async pre-fetch on call start
  - [ ] Real-time section updates
- [ ] Implement CRM Tool (mock data)
  - [ ] Mock client database
  - [ ] Query interface
  - [ ] Update interface
- [ ] Add Logger Service
  - [ ] Structured logging
  - [ ] Event emission
  - [ ] Metrics tracking

### Phase 4: Testing & Cleanup (Days 4-5)
- [ ] Integration testing
  - [ ] Complete conversation flow
  - [ ] State transitions
  - [ ] Checkbox completion
  - [ ] Summary approval
  - [ ] Objection handling
  - [ ] Interruption handling
- [ ] Edge case testing
  - [ ] Multiple intents
  - [ ] Intent switching
  - [ ] Premature pricing questions
  - [ ] Customer silence
  - [ ] Conversation repair
- [ ] Deprecate old components
  - [ ] Sales Orchestrator
  - [ ] Sales Heuristics
  - [ ] Gemini Client
  - [ ] Sidecar Agents
- [ ] Update UI
  - [ ] Display current state
  - [ ] Show checkbox progress
  - [ ] Show deal health scores
- [ ] Documentation
  - [ ] API documentation
  - [ ] Workflow documentation
  - [ ] Deployment guide

---

## Success Criteria

✅ **Single orchestrator**: Mastra only, no conflicts
✅ **Single LLM provider**: Smallest.ai for all AI calls
✅ **Single memory system**: Extended Thread Memory
✅ **Proper voice loop**: Customer speaks → Agent speaks back (TTS working)
✅ **State persistence**: No intent thrashing, coherent state transitions
✅ **Checkbox-driven discovery**: Structured exploration using SOLUTIONS.md
✅ **Markdown-controlled**: Easy to iterate on prompts without code changes
✅ **Interruptible**: Natural conversation flow with barge-in support
✅ **Compliant**: RULES.md enforcement via Compliance Engine
✅ **Observable**: Logging and metrics for debugging and optimization

---

## Risk Mitigation

### Risk 1: Mastra Runtime Integration Complexity
**Mitigation**: Start with simplest workflow (Intent Router), validate end-to-end, then add others incrementally.

### Risk 2: State Machine Bugs
**Mitigation**: Comprehensive unit tests for all state transitions. Log all transitions for debugging.

### Risk 3: CLIENT.md Update Race Conditions
**Mitigation**: Single-threaded update queue. Use locks if concurrent updates needed.

### Risk 4: TTS/Audio Buffer Synchronization
**Mitigation**: Prototype Sentence Audio Buffer independently before full integration.

### Risk 5: Prompt Size Exceeding LLM Context Window
**Mitigation**: Monitor token counts. Implement context window management (truncate older conversation history if needed).

---

## Next Steps

After design approval:
1. Invoke `writing-plans` skill to create detailed implementation plan
2. Execute implementation in phases (Foundation → Workflows → Integration → Testing)
3. Continuous validation against success criteria
4. Deploy to parent Momentum_AI directory

---

**End of Design Document**
