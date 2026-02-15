# Workflow Controller Integration Guide

## Quick Start

To wire up all workflows to the existing WorkflowController, follow these steps:

### Step 1: Import Workflows

```typescript
import {
  IntentRouterWorkflow,
  IntentConfirmationWorkflow,
  SolutionExplorerWorkflow,
  SummaryGeneratorWorkflow,
  ObjectionHandlerWorkflow,
  SolutionProposalWorkflow,
  ClarificationWorkflow,
  ConversationRepairWorkflow
} from './workflows'
```

### Step 2: Register Workflows in Constructor

Update the `WorkflowController` constructor to register all workflow instances:

```typescript
constructor(private memory: ThreadMemory) {
  this.workflows = new Map()
  
  // Core workflows mapped to states
  this.registerWorkflow(
    ConversationState.INTENT_DETECTION,
    new IntentRouterWorkflow()
  )
  
  this.registerWorkflow(
    ConversationState.INTENT_CONFIRMATION,
    new IntentConfirmationWorkflow()
  )
  
  this.registerWorkflow(
    ConversationState.SOLUTION_EXPLORATION,
    new SolutionExplorerWorkflow()
  )
  
  this.registerWorkflow(
    ConversationState.SUMMARY_REVIEW,
    new SummaryGeneratorWorkflow()
  )
  
  this.registerWorkflow(
    ConversationState.OBJECTION_HANDLING,
    new ObjectionHandlerWorkflow()
  )
  
  this.registerWorkflow(
    ConversationState.INTENT_RESOLUTION,
    new SolutionProposalWorkflow()
  )
  
  this.registerWorkflow(
    ConversationState.CONVERSATION_REPAIR,
    new ConversationRepairWorkflow()
  )
  
  // Clarification workflow can be used from any state
  this.clarificationWorkflow = new ClarificationWorkflow()
}
```

### Step 3: Add Pre-Processing Logic

Before routing to state-based workflows, check for patterns that require special workflows:

```typescript
async processTranscript(transcript: string): Promise<string> {
  const currentState = this.memory.getCurrentState()
  
  // Pre-process: Check for repair signals
  if (this.needsRepair(transcript)) {
    const repairWorkflow = new ConversationRepairWorkflow()
    const result = await repairWorkflow.execute({
      transcript,
      memory: this.memory,
      state: currentState
    })
    return this.handleWorkflowResult(result)
  }
  
  // Pre-process: Check for clarification needed
  if (this.needsClarification(transcript)) {
    const result = await this.clarificationWorkflow.execute({
      transcript,
      memory: this.memory,
      state: currentState
    })
    return this.handleWorkflowResult(result)
  }
  
  // Pre-process: Check for objection
  if (this.hasObjection(transcript)) {
    const objectionWorkflow = this.workflows.get(ConversationState.OBJECTION_HANDLING)
    const result = await objectionWorkflow!.execute({
      transcript,
      memory: this.memory,
      state: currentState
    })
    return this.handleWorkflowResult(result)
  }
  
  // Standard state-based routing
  const workflow = this.workflows.get(currentState)
  if (!workflow) {
    throw new Error(`No workflow for state: ${currentState}`)
  }
  
  const result = await workflow.execute({
    transcript,
    memory: this.memory,
    state: currentState
  })
  
  return this.handleWorkflowResult(result)
}
```

### Step 4: Add Detection Helpers

```typescript
private needsRepair(transcript: string): boolean {
  const repairSignals = [
    /\bwait\b/i,
    /\blost\b/i,
    /\bconfused\b/i,
    /that's not what i said/i,
    /you're wrong/i,
    /what were we/i
  ]
  
  return repairSignals.some(pattern => pattern.test(transcript))
}

private needsClarification(transcript: string): boolean {
  const clarificationSignals = [
    /\bmaybe\b/i,
    /\bi guess\b/i,
    /\bsort of\b/i,
    /\bkind of\b/i,
    /\bi'm not sure\b/i
  ]
  
  return clarificationSignals.some(pattern => pattern.test(transcript))
}

private hasObjection(transcript: string): boolean {
  const objectionSignals = [
    /\bexpensive\b/i,
    /\btoo much\b/i,
    /\bcan't afford\b/i,
    /\bdon't have time\b/i,
    /\bnot sure\b/i,
    /\bskeptical\b/i
  ]
  
  return objectionSignals.some(pattern => pattern.test(transcript))
}
```

### Step 5: Handle Workflow Results

```typescript
private handleWorkflowResult(result: WorkflowResult): string {
  // Handle state transitions
  if (result.nextState && result.nextState !== this.memory.getCurrentState()) {
    this.memory.transitionState(result.nextState)
  }
  
  // Handle checkbox updates
  if (result.checkboxUpdates) {
    for (const [key, value] of Object.entries(result.checkboxUpdates)) {
      const weight = result.checkboxWeights?.[key] || 1.0
      this.memory.updateCheckbox(key, value, weight)
    }
  }
  
  // Handle intent detection
  if (result.intentDetected) {
    this.memory.lockIntent(
      result.intentDetected.intent,
      result.intentDetected.confidence
    )
  }
  
  return result.response
}
```

## Testing Examples

### Example 1: Intent Detection Flow

```typescript
// Initial state: INTENT_DETECTION
const transcript1 = "We're running 9 marketing channels and can't figure out which ones work"

// Should trigger IntentRouterWorkflow
// - Matches triggers: "channels", "marketing"
// - Intent: ECOSYSTEM_MAPPING_INQUIRY
// - Confidence: 0.85
// - Output: Confirmation question

// Expected: State → INTENT_CONFIRMATION
```

### Example 2: Discovery Flow

```typescript
// State: SOLUTION_EXPLORATION
// Intent: ECOSYSTEM_MAPPING_INQUIRY
const transcript2 = "LinkedIn, Facebook, Google Ads, email, organic..."

// Should trigger SolutionExplorerWorkflow
// - Extract: current_channels = "LinkedIn, Facebook, Google Ads, email, organic"
// - Update checkbox: current_channels (weight 1.0)
// - Calculate completeness
// - Find next checkbox: channel_coherence
// - Output: Next discovery question
```

### Example 3: Objection Handling

```typescript
// State: INTENT_RESOLUTION
const transcript3 = "That sounds expensive"

// Should detect objection and trigger ObjectionHandlerWorkflow
// - Objection type: PRICE_BUDGET
// - Strategy: Value reframing
// - Output: ROI-focused response
// - State: OBJECTION_HANDLING
```

## Additional Utilities Needed

### Completeness Calculator (for ThreadMemory)

```typescript
// Add to ThreadMemory class
getCompleteness(): number {
  let totalWeight = 0
  let completedWeight = 0
  
  for (const checkbox of this.checkboxes) {
    totalWeight += checkbox.weight
    if (checkbox.completed) {
      completedWeight += checkbox.weight
    }
  }
  
  return totalWeight > 0 ? completedWeight / totalWeight : 0
}
```

### Intent Lock Methods (if not already in ThreadMemory)

```typescript
// Add to ThreadMemory class if missing
lockIntent(intent: string, confidence: number): void {
  this.intentLock = { intent, confidence, timestamp: new Date() }
}

getIntentLock(): { intent: string; confidence: number; timestamp: Date } | null {
  return this.intentLock
}
```

## Next Steps

1. **Update WorkflowController** with the integration code above
2. **Add missing ThreadMemory methods** (completeness, intent lock)
3. **Create test suite** to verify state transitions
4. **Add LLM integration** to replace heuristic extraction
5. **Wire up CLIENT.md** file system integration

## Architecture Diagram

```
Customer Transcript
        ↓
  WorkflowController
        ↓
    Pre-Process
    - Repair check
    - Clarification check
    - Objection check
        ↓
  State-Based Routing
        ↓
    Execute Workflow
    - Intent Router
    - Intent Confirmation
    - Solution Explorer
    - Summary Generator
    - Objection Handler
    - Solution Proposal
    - Clarification
    - Conversation Repair
        ↓
   Handle Result
    - State transition
    - Checkbox updates
    - Intent locking
        ↓
   Return Response
```
