# **Mastra Workflows: Complete Flow Diagrams & Explanations**

I'll create detailed Mermaid diagrams for each workflow showing how they operate within the system.

---

## **🎯 Workflow Overview**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#51cf66','secondaryColor':'\#ffc943'}} }%%  
graph TB  
    WC\[Workflow Controller\<br/\>Decision Brain\]  
      
    WC \--\>|State: INTENT\_DETECTION| W1\[Intent Router Workflow\]  
    WC \--\>|State: INTENT\_CONFIRMATION| W2\[Intent Confirmation Workflow\]  
    WC \--\>|State: SOLUTION\_EXPLORATION| W3\[Solution Explorer Workflow\]  
    WC \--\>|State: SUMMARY\_REVIEW| W4\[Summary Generator Workflow\]  
    WC \--\>|State: OBJECTION\_HANDLING| W5\[Objection Handler Workflow\]  
    WC \--\>|State: INTENT\_RESOLUTION| W6\[Solution Proposal Workflow\]  
    WC \--\>|Any State (edge case)| W7\[Clarification Workflow\]  
    WC \--\>|Any State (confusion)| W8\[Conversation Repair Workflow\]  
      
    style W1 fill:\#ffc943,stroke:\#e8a302,stroke-width:3px  
    style W2 fill:\#74c0fc,stroke:\#1971c2,stroke-width:3px  
    style W3 fill:\#51cf66,stroke:\#37b24d,stroke-width:3px  
    style W4 fill:\#a78bfa,stroke:\#7c3aed,stroke-width:3px  
    style W5 fill:\#fb923c,stroke:\#ea580c,stroke-width:3px  
    style W6 fill:\#34d399,stroke:\#059669,stroke-width:3px  
    style W7 fill:\#fbbf24,stroke:\#d97706,stroke-width:3px  
    style W8 fill:\#f87171,stroke:\#dc2626,stroke-width:3px

---

## **1️⃣ Intent Router Workflow**

**Purpose**: Classify customer's intent from their opening statement and generate confirmation question

**Trigger**: State \= INTENT\_DETECTION, no intent locked yet

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#ffc943','secondaryColor':'\#51cf66'}} }%%  
sequenceDiagram  
    autonumber  
    participant WC as Workflow Controller  
    participant IRW as Intent Router Workflow  
    participant PB as Prompt Builder  
    participant SR as Solutions Registry  
    participant LLM as Smallest LLM  
    participant TM as Thread Memory  
    participant CM as CLIENT.md  
      
    Note over WC,CM: Customer said: "We're getting leads but they're not converting"  
      
    WC-\>\>IRW: execute(context)  
      
    rect rgb(255, 201, 67, 0.2)  
    Note over IRW: PHASE 1: Load Intent Definitions  
    end  
      
    IRW-\>\>SR: getAllIntents()  
    SR--\>\>IRW: \[\<br/\>  ECOSYSTEM\_MAPPING: triggers=\["lead quality", "channels", "conversion"\],\<br/\>  PRICING\_INQUIRY: triggers=\["pricing", "cost", "investment"\],\<br/\>  OFFER\_ARCHITECTURE: triggers=\["packaging", "positioning"\],\<br/\>  ...\<br/\>\]  
      
    rect rgb(255, 201, 67, 0.2)  
    Note over IRW: PHASE 2: Build Classification Prompt  
    end  
      
    IRW-\>\>PB: buildIntentClassificationPrompt({\<br/\>  transcript: "We're getting leads...",\<br/\>  intentDefinitions: \[...\],\<br/\>  conversationHistory: \[\]\<br/\>})  
      
    PB-\>\>PB: Load AGENT.md section:\<br/\>"CASE 2: Intent Not Yet Detected"  
    PB-\>\>PB: Load SOLUTIONS.md triggers  
    PB-\>\>PB: Load IDENTITY.md tone  
      
    PB--\>\>IRW: Assembled prompt:\<br/\>"Classify customer intent against SOLUTIONS.md triggers..."  
      
    rect rgb(255, 201, 67, 0.2)  
    Note over IRW,LLM: PHASE 3: LLM Classification  
    end  
      
    IRW-\>\>LLM: Generate classification  
      
    Note over LLM: LLM analyzes:\<br/\>"leads" \+ "not converting" \+ "channels"\<br/\>= ECOSYSTEM\_MAPPING\_INQUIRY  
      
    LLM--\>\>IRW: {\<br/\>  intent: "ECOSYSTEM\_MAPPING\_INQUIRY",\<br/\>  confidence: 0.89,\<br/\>  reasoning: "Customer mentions lead quality and conversion issues"\<br/\>}  
      
    rect rgb(255, 201, 67, 0.2)  
    Note over IRW: PHASE 4: Confidence Check  
    end  
      
    IRW-\>\>IRW: if (confidence \>= 0.75) {\<br/\>  generateConfirmation()\<br/\>} else {\<br/\>  askClarifyingQuestion()\<br/\>}  
      
    rect rgb(255, 201, 67, 0.2)  
    Note over IRW: PHASE 5: Generate Confirmation  
    end  
      
    IRW-\>\>PB: buildConfirmationPrompt({\<br/\>  intent: "ECOSYSTEM\_MAPPING\_INQUIRY",\<br/\>  transcript: "We're getting leads...",\<br/\>  confidence: 0.89\<br/\>})  
      
    PB-\>\>SR: getIntentDescription("ECOSYSTEM\_MAPPING\_INQUIRY")  
    SR--\>\>PB: "Map the ecosystem to find cross-channel friction"  
      
    PB--\>\>IRW: Prompt: "Generate natural confirmation question..."  
      
    IRW-\>\>LLM: Generate confirmation  
      
    LLM--\>\>IRW: "It sounds like you're dealing with lead quality issues—getting traffic but not the right conversions. Is that what you're trying to fix?"  
      
    rect rgb(255, 201, 67, 0.2)  
    Note over IRW: PHASE 6: Store & Return  
    end  
      
    IRW-\>\>TM: storeDetectedIntent({\<br/\>  intent: "ECOSYSTEM\_MAPPING\_INQUIRY",\<br/\>  confidence: 0.89,\<br/\>  locked: false\<br/\>})  
      
    IRW-\>\>CM: Update section 2 (Stated Problem):\<br/\>"Lead quality issues, conversion problems"  
      
    IRW-\>\>CM: Update section 14 (Last Transcript Analysis):\<br/\>intentDetected: "ECOSYSTEM\_MAPPING\_INQUIRY"  
      
    IRW--\>\>WC: WorkflowResult {\<br/\>  response: "It sounds like you're dealing with...",\<br/\>  detectedIntent: "ECOSYSTEM\_MAPPING\_INQUIRY",\<br/\>  confidence: 0.89,\<br/\>  nextState: INTENT\_CONFIRMATION,\<br/\>  clientMdUpdates: {...}\<br/\>}

### **Intent Router Logic Flow**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#ffc943'}} }%%  
flowchart TD  
    Start\[Customer Transcript\] \--\> Load\[Load SOLUTIONS.md Intent Triggers\]  
      
    Load \--\> Build\[Build Classification Prompt\<br/\>AGENT.md \+ SOLUTIONS.md \+ transcript\]  
      
    Build \--\> Classify\[LLM: Classify Intent\]  
      
    Classify \--\> Check{Confidence \>= 0.75?}  
      
    Check \--\>|Yes \- High Confidence| Confirm\[Generate Confirmation Question\]  
    Check \--\>|No \- Low Confidence| Clarify\[Ask Open-Ended Clarifying Question\]  
      
    Confirm \--\> Store1\[Store detected\_intent in Thread Memory\<br/\>locked: false\]  
    Clarify \--\> Store2\[Store: intent unclear\]  
      
    Store1 \--\> Update1\[Update CLIENT.md:\<br/\>Section 2: Stated Problem\<br/\>Section 14: Intent Detected\]  
    Store2 \--\> Update2\[Update CLIENT.md:\<br/\>Section 9: Discovery Gaps\]  
      
    Update1 \--\> Return1\[Return: Confirmation \+ INTENT\_CONFIRMATION state\]  
    Update2 \--\> Return2\[Return: Clarifying question \+ stay in INTENT\_DETECTION\]  
      
    style Check fill:\#ffc943,stroke:\#e8a302,stroke-width:3px  
    style Confirm fill:\#51cf66,stroke:\#37b24d,stroke-width:3px  
    style Clarify fill:\#fb923c,stroke:\#ea580c,stroke-width:3px

---

## **2️⃣ Intent Confirmation Workflow**

**Purpose**: Get explicit yes/no confirmation from customer before locking intent

**Trigger**: Intent detected with high confidence, awaiting customer validation

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#74c0fc','secondaryColor':'\#51cf66'}} }%%  
sequenceDiagram  
    autonumber  
    participant Customer  
    participant WC as Workflow Controller  
    participant ICW as Intent Confirmation Workflow  
    participant TM as Thread Memory  
    participant PB as Prompt Builder  
    participant LLM as Smallest LLM  
    participant CM as CLIENT.md  
      
    Note over Customer,CM: Previous turn: "It sounds like you're dealing with lead quality issues. Is that right?"  
      
    Customer-\>\>WC: "Yes, exactly. We run 9 channels and they're all different."  
      
    WC-\>\>ICW: execute(context)  
      
    rect rgb(116, 192, 252, 0.2)  
    Note over ICW: PHASE 1: Parse Response Type  
    end  
      
    ICW-\>\>ICW: detectResponseType(transcript)  
      
    ICW-\>\>ICW: Patterns:\<br/\>✓ Confirmation: /yes|exactly|that's right|spot on/\<br/\>✓ Rejection: /no|not quite|actually|instead/\<br/\>✓ Uncertain: /maybe|I guess|sort of|kind of/  
      
    Note over ICW: Match found: "Yes, exactly" → CONFIRMATION  
      
    rect rgb(116, 192, 252, 0.2)  
    Note over ICW: PHASE 2: Extract Additional Context  
    end  
      
    ICW-\>\>LLM: Extract entities from:\<br/\>"Yes, exactly. We run 9 channels and they're all different."  
      
    LLM--\>\>ICW: Extracted:\<br/\>- channel\_count: 9\<br/\>- coherence\_issue: "all different"  
      
    rect rgb(116, 192, 252, 0.2)  
    Note over ICW: PHASE 3: Lock Intent & Load Checkboxes  
    end  
      
    ICW-\>\>TM: lockIntent({\<br/\>  intent: "ECOSYSTEM\_MAPPING\_INQUIRY",\<br/\>  confidence: 0.89,\<br/\>  lockedAt: timestamp\<br/\>})  
      
    ICW-\>\>TM: initializeCheckboxes(\[\<br/\>  {key: "current\_channels", value: 9, completed: true, weight: 1.0},\<br/\>  {key: "channel\_coherence", value: "all different", completed: true, weight: 0.7},\<br/\>  {key: "current\_pain\_point", value: null, completed: false, weight: 1.0},\<br/\>  ...\<br/\>\])  
      
    rect rgb(116, 192, 252, 0.2)  
    Note over ICW: PHASE 4: Generate Transition Response  
    end  
      
    ICW-\>\>PB: buildTransitionPrompt({\<br/\>  confirmedIntent: "ECOSYSTEM\_MAPPING\_INQUIRY",\<br/\>  extractedContext: {channels: 9, coherence: "different"},\<br/\>  nextPhase: "discovery"\<br/\>})  
      
    PB--\>\>ICW: Prompt: "Acknowledge confirmation and smoothly transition to first discovery question..."  
      
    ICW-\>\>LLM: Generate transition  
      
    LLM--\>\>ICW: "Perfect. 9 channels—that's a lot to coordinate. Walk me through what message someone sees if they hit your LinkedIn ad versus your organic posts. Same story or different?"  
      
    rect rgb(116, 192, 252, 0.2)  
    Note over ICW: PHASE 5: Update State & CLIENT.md  
    end  
      
    ICW-\>\>TM: transitionState(SOLUTION\_EXPLORATION)  
      
    ICW-\>\>CM: Update section 3 (Inferred Core Problem):\<br/\>"Channel incoherence causing conversion drop"\<br/\>confidence: medium  
      
    ICW-\>\>CM: Update section 4 (Metrics):\<br/\>Channels: 9  
      
    ICW-\>\>CM: Update section 5 (Emotional Signals):\<br/\>Positive: Customer willing to engage\<br/\>Friction: Overwhelm from channel count  
      
    ICW--\>\>WC: WorkflowResult {\<br/\>  response: "Perfect. 9 channels—that's a lot...",\<br/\>  intentLocked: true,\<br/\>  nextState: SOLUTION\_EXPLORATION,\<br/\>  checkboxesInitialized: true,\<br/\>  clientMdUpdates: {...}\<br/\>}

### **Intent Confirmation Decision Tree**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#74c0fc'}} }%%  
flowchart TD  
    Start\[Customer Response to Intent Confirmation\] \--\> Parse\[Parse Response Type\]  
      
    Parse \--\> TypeCheck{Response Type?}  
      
    TypeCheck \--\>|CONFIRMATION\<br/\>"Yes, exactly"| Lock\[Lock Intent in Thread Memory\]  
    TypeCheck \--\>|REJECTION\<br/\>"No, actually"| Clear\[Clear Detected Intent\]  
    TypeCheck \--\>|UNCERTAIN\<br/\>"Maybe, I guess"| Rephrase\[Rephrase Intent with More Context\]  
    TypeCheck \--\>|TANGENT\<br/\>Off-topic| Redirect\[Gentle Redirect\]  
      
    Lock \--\> Extract\[Extract Additional Context\<br/\>from Customer Response\]  
      
    Extract \--\> InitCheckboxes\[Initialize Checkbox Registry\<br/\>from SOLUTIONS.md\]  
      
    InitCheckboxes \--\> PreFill\[Pre-fill any checkboxes\<br/\>from extracted context\]  
      
    PreFill \--\> Transition1\[Generate Transition Response\<br/\>Acknowledge \+ First Discovery Question\]  
      
    Transition1 \--\> Return1\[Return: Response \+ SOLUTION\_EXPLORATION state\]  
      
    Clear \--\> Restart\[Return to INTENT\_DETECTION\]  
    Restart \--\> Return2\[Return: "What are you actually trying to solve?"\]  
      
    Rephrase \--\> Elaborate\[Generate Elaborated Confirmation\]  
    Elaborate \--\> Return3\[Return: Rephrased \+ stay in INTENT\_CONFIRMATION\]  
      
    Redirect \--\> Acknowledge\[Acknowledge tangent briefly\]  
    Acknowledge \--\> Return4\[Return: Redirect to confirmation\]  
      
    style TypeCheck fill:\#74c0fc,stroke:\#1971c2,stroke-width:3px  
    style Lock fill:\#51cf66,stroke:\#37b24d,stroke-width:3px  
    style Clear fill:\#fb923c,stroke:\#ea580c,stroke-width:3px  
    style Rephrase fill:\#fbbf24,stroke:\#d97706,stroke-width:3px

---

## **3️⃣ Solution Explorer Workflow**

**Purpose**: Systematically discover information by asking weighted checkbox questions

**Trigger**: Intent locked, state \= SOLUTION\_EXPLORATION, completeness \< 0.8

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#51cf66','secondaryColor':'\#ffc943'}} }%%  
sequenceDiagram  
    autonumber  
    participant Customer  
    participant WC as Workflow Controller  
    participant SEW as Solution Explorer Workflow  
    participant TM as Thread Memory  
    participant SR as Solutions Registry  
    participant PB as Prompt Builder  
    participant LLM as Smallest LLM  
    participant CM as CLIENT.md  
      
    Note over Customer,CM: Intent locked: ECOSYSTEM\_MAPPING\_INQUIRY\<br/\>Previous Q: "What message do people see in your ads vs organic?"  
      
    Customer-\>\>WC: "Totally different. Ads talk about ROI, organic is brand storytelling."  
      
    WC-\>\>SEW: execute(context)  
      
    rect rgb(81, 207, 102, 0.2)  
    Note over SEW: PHASE 1: Extract & Update Current Checkbox  
    end  
      
    SEW-\>\>LLM: Extract answer to "channel\_coherence" from:\<br/\>"Totally different. Ads talk about ROI, organic is brand storytelling."  
      
    LLM--\>\>SEW: Structured extraction:\<br/\>{\<br/\>  channel\_coherence: "Misaligned \- Ads=ROI, Organic=Brand",\<br/\>  emotional\_signal: "Self-aware (knows it's misaligned)"\<br/\>}  
      
    SEW-\>\>TM: updateCheckbox({\<br/\>  key: "channel\_coherence",\<br/\>  value: "Misaligned \- Ads=ROI, Organic=Brand",\<br/\>  completed: true,\<br/\>  weight: 0.7\<br/\>})  
      
    rect rgb(81, 207, 102, 0.2)  
    Note over SEW: PHASE 2: Calculate Completeness Score  
    end  
      
    SEW-\>\>TM: getCheckboxes()  
    TM--\>\>SEW: \[\<br/\>  {key: "current\_channels", completed: true, weight: 1.0},\<br/\>  {key: "channel\_coherence", completed: true, weight: 0.7},\<br/\>  {key: "lead\_quality\_variance", completed: false, weight: 1.0},\<br/\>  {key: "current\_pain\_point", completed: false, weight: 1.0},\<br/\>  {key: "current\_metrics", completed: false, weight: 0.7},\<br/\>  ...\<br/\>\]  
      
    SEW-\>\>SEW: calculateCompletionScore()\<br/\>\<br/\>Completed weight: 1.0 \+ 0.7 \= 1.7\<br/\>Total weight: 1.0 \+ 0.7 \+ 1.0 \+ 1.0 \+ 0.7 \+ ... \= 5.1\<br/\>\<br/\>Score: 1.7 / 5.1 \= 0.33  
      
    Note over SEW: Score 0.33 \< 0.8 threshold\<br/\>→ Continue discovery  
      
    rect rgb(81, 207, 102, 0.2)  
    Note over SEW: PHASE 3: Select Next Checkbox  
    end  
      
    SEW-\>\>SR: getCheckboxes("ECOSYSTEM\_MAPPING\_INQUIRY")  
    SR--\>\>SEW: All checkbox definitions  
      
    SEW-\>\>SEW: findNextCheckbox()\<br/\>\<br/\>Strategy:\<br/\>1. Filter out completed\<br/\>2. Sort by weight (critical → important → nice-to-have)\<br/\>3. Return first uncompleted  
      
    Note over SEW: Next: "lead\_quality\_variance"\<br/\>Weight: 1.0 (CRITICAL)\<br/\>Question: "Do they see hot weeks vs. cold weeks?"  
      
    rect rgb(81, 207, 102, 0.2)  
    Note over SEW: PHASE 4: Generate Discovery Question  
    end  
      
    SEW-\>\>PB: buildDiscoveryPrompt({\<br/\>  checkbox: "lead\_quality\_variance",\<br/\>  checkboxMeta: {\<br/\>    question: "Do they see hot weeks vs cold weeks? What changes?",\<br/\>    weight: 1.0,\<br/\>    description: "Evidence of inconsistent lead quality"\<br/\>  },\<br/\>  conversationHistory: \[...\],\<br/\>  previousAnswer: "Ads=ROI, Organic=Brand"\<br/\>})  
      
    PB-\>\>PB: Load IDENTITY.md:\<br/\>"Sound consultative, not like a form"  
      
    PB-\>\>PB: Load SOLUTIONS.md context:\<br/\>"Why this matters: Hot/cold patterns reveal ecosystem issues"  
      
    PB--\>\>SEW: Prompt: "Generate natural discovery question..."  
      
    SEW-\>\>LLM: Generate question  
      
    LLM--\>\>SEW: "That's interesting—you know it's misaligned. Have you noticed times when leads are super engaged versus when they go cold? Like hot weeks versus cold weeks?"  
      
    rect rgb(81, 207, 102, 0.2)  
    Note over SEW: PHASE 5: Update CLIENT.md  
    end  
      
    SEW-\>\>CM: Update section 4 (Metrics):\<br/\>Channel coherence: Misaligned  
      
    SEW-\>\>CM: Update section 5 (Emotional Signals):\<br/\>Positive: Self-aware about misalignment  
      
    SEW-\>\>CM: Update section 10 (Strategic Levers):\<br/\>Hypothesis: Message alignment will improve conversion  
      
    SEW-\>\>CM: Update section 11 (Deal Health):\<br/\>painClarityScore: 7/10 (increasing)  
      
    SEW--\>\>WC: WorkflowResult {\<br/\>  response: "That's interesting—you know...",\<br/\>  nextCheckbox: "lead\_quality\_variance",\<br/\>  completionScore: 0.33,\<br/\>  nextState: SOLUTION\_EXPLORATION,\<br/\>  clientMdUpdates: {...}\<br/\>}  
      
    Note over Customer,CM: Workflow continues until completeness \>= 0.8

### **Solution Explorer Logic Flow**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#51cf66'}} }%%  
flowchart TD  
    Start\[Customer Response\] \--\> Extract\[LLM: Extract Answer to Current Checkbox\]  
      
    Extract \--\> Update\[Update Checkbox in Thread Memory\]  
      
    Update \--\> UpdateCM\[Update CLIENT.md Sections\<br/\>4: Metrics, 5: Emotional Signals, 10: Levers\]  
      
    UpdateCM \--\> Calc\[Calculate Completeness Score\]  
      
    Calc \--\> Check{Score \>= 0.8?}  
      
    Check \--\>|Yes| Done\[All discovery complete\]  
    Check \--\>|No| FindNext\[Find Next Uncompleted Checkbox\]  
      
    FindNext \--\> Sort\[Sort by Priority:\<br/\>1. Critical weight=1.0\<br/\>2. Important weight=0.7\<br/\>3. Nice-to-have weight=0.3\]  
      
    Sort \--\> Select\[Select First Uncompleted\]  
      
    Select \--\> Build\[Build Discovery Question Prompt\<br/\>SOLUTIONS.md \+ IDENTITY.md \+ conversation history\]  
      
    Build \--\> Generate\[LLM: Generate Natural Question\]  
      
    Generate \--\> Return1\[Return: Question \+ SOLUTION\_EXPLORATION state\]  
      
    Done \--\> Transition\[Transition to SUMMARY\_REVIEW\]  
    Transition \--\> Return2\[Return: Ready for summary\]  
      
    style Check fill:\#51cf66,stroke:\#37b24d,stroke-width:3px  
    style Sort fill:\#ffc943,stroke:\#e8a302,stroke-width:3px

### **Weighted Checkbox Selection Algorithm**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#51cf66'}} }%%  
flowchart LR  
    subgraph "Checkbox Registry (ECOSYSTEM\_MAPPING)"  
        C1\[current\_channels\<br/\>Weight: 1.0\<br/\>Status: ✓ Completed\]  
        C2\[lead\_quality\_variance\<br/\>Weight: 1.0\<br/\>Status: ○ Pending\]  
        C3\[current\_pain\_point\<br/\>Weight: 1.0\<br/\>Status: ○ Pending\]  
        C4\[channel\_coherence\<br/\>Weight: 0.7\<br/\>Status: ✓ Completed\]  
        C5\[current\_metrics\<br/\>Weight: 0.7\<br/\>Status: ○ Pending\]  
        C6\[volume\_vs\_quality\<br/\>Weight: 0.7\<br/\>Status: ○ Pending\]  
        C7\[team\_size\<br/\>Weight: 0.3\<br/\>Status: ○ Pending\]  
        C8\[budget\_range\<br/\>Weight: 0.3\<br/\>Status: ○ Pending\]  
    end  
      
    subgraph "Selection Algorithm"  
        Filter\[Filter: Only Pending Checkboxes\]  
        Sort\[Sort: By Weight DESC\]  
        Pick\[Pick: First Item\]  
    end  
      
    C1 \--\> Filter  
    C2 \--\> Filter  
    C3 \--\> Filter  
    C4 \--\> Filter  
    C5 \--\> Filter  
    C6 \--\> Filter  
    C7 \--\> Filter  
    C8 \--\> Filter  
      
    Filter \--\> Sort  
    Sort \--\> Pick  
      
    Pick \--\> Selected\[Selected: lead\_quality\_variance\<br/\>Weight: 1.0 CRITICAL\]  
      
    style C1 fill:\#51cf66,stroke:\#37b24d,stroke-width:2px  
    style C4 fill:\#51cf66,stroke:\#37b24d,stroke-width:2px  
    style Selected fill:\#ffc943,stroke:\#e8a302,stroke-width:4px

---

## **4️⃣ Summary Generator Workflow**

**Purpose**: Create structured summary of all discovered information and get customer validation

**Trigger**: Completeness score \>= 0.8

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#a78bfa','secondaryColor':'\#51cf66'}} }%%  
sequenceDiagram  
    autonumber  
    participant WC as Workflow Controller  
    participant SGW as Summary Generator Workflow  
    participant TM as Thread Memory  
    participant SR as Solutions Registry  
    participant PB as Prompt Builder  
    participant LLM as Smallest LLM  
    participant CE as Compliance Engine  
    participant CM as CLIENT.md  
      
    Note over WC,CM: Completeness: 0.85 \>= 0.8 threshold

      
    WC-\>\>SGW: execute(context)  
      
    rect rgb(167, 139, 250, 0.2)  
    Note over SGW: PHASE 1: Gather All Checkbox Data  
    end  
      
    SGW-\>\>TM: getCheckboxes()  
    TM--\>\>SGW: \[\<br/\>  {key: "current\_channels", value: "9 channels", completed: true},\<br/\>  {key: "channel\_coherence", value: "Misaligned", completed: true},\<br/\>  {key: "lead\_quality\_variance", value: "Week 1 hot, Week 2 cold", completed: true},\<br/\>  {key: "current\_pain\_point", value: "Conversion drop", completed: true},\<br/\>  {key: "current\_metrics", value: "Conv rate, revenue", completed: true},\<br/\>  ...\<br/\>\]  
      
    SGW-\>\>TM: getIntentLock()  
    TM--\>\>SGW: {\<br/\>  intent: "ECOSYSTEM\_MAPPING\_INQUIRY",\<br/\>  confidence: 0.89\<br/\>}  
      
    rect rgb(167, 139, 250, 0.2)  
    Note over SGW: PHASE 2: Load Summary Template  
    end  
      
    SGW-\>\>SR: getSummaryTemplate("ECOSYSTEM\_MAPPING\_INQUIRY")  
    SR--\>\>SGW: Template from SOLUTIONS.md:\<br/\>"Let me make sure I understand: You're running {current\_channels}..."  
      
    rect rgb(167, 139, 250, 0.2)  
    Note over SGW: PHASE 3: Load CLIENT.md Context  
    end  
      
    SGW-\>\>CM: load()  
    CM--\>\>SGW: Full CLIENT.md content:\<br/\>- Section 2: Stated problem\<br/\>- Section 3: Inferred core problem\<br/\>- Section 5: Emotional signals\<br/\>- Section 10: Strategic levers  
      
    rect rgb(167, 139, 250, 0.2)  
    Note over SGW: PHASE 4: Build Summary Prompt  
    end  
      
    SGW-\>\>PB: buildSummaryPrompt({\<br/\>  template: "Let me make sure I understand...",\<br/\>  checkboxData: \[...\],\<br/\>  clientMd: {...},\<br/\>  intent: "ECOSYSTEM\_MAPPING\_INQUIRY"\<br/\>})  
      
    PB-\>\>PB: Load IDENTITY.md:\<br/\>"Reflective, consultative tone"  
      
    PB-\>\>PB: Load PROMPT.md:\<br/\>Summary section template  
      
    PB--\>\>SGW: Assembled prompt:\<br/\>"Create natural summary using checkbox data..."  
      
    rect rgb(167, 139, 250, 0.2)  
    Note over SGW,LLM: PHASE 5: Generate Summary  
    end  
      
    SGW-\>\>LLM: Generate summary  
      
    LLM--\>\>SGW: Draft summary:\<br/\>"Let me make sure I'm tracking with you. You're running 9 channels, and your ads talk ROI while organic is brand-focused—totally different messages. You're seeing hot weeks and cold weeks with no clear pattern. Right now you're tracking conversion rate and revenue, and the biggest issue is leads click but don't convert. Is that accurate, or did I miss something important?"  
      
    rect rgb(167, 139, 250, 0.2)  
    Note over SGW: PHASE 6: Compliance Check  
    end  
      
    SGW-\>\>CE: validate(summary)  
      
    CE-\>\>CE: Check RULES.md:\<br/\>✓ No over-promising\<br/\>✓ No guarantees\<br/\>✓ No misleading claims\<br/\>✓ Permission-based language  
      
    CE--\>\>SGW: ✅ Compliant  
      
    rect rgb(167, 139, 250, 0.2)  
    Note over SGW: PHASE 7: Update CLIENT.md  
    end  
      
    SGW-\>\>CM: Update section 11 (Deal Health):\<br/\>painClarityScore: 9/10 (high clarity achieved)  
      
    SGW-\>\>CM: Update section 13 (Conversation History):\<br/\>Key moment: "Summary presented \- awaiting validation"  
      
    SGW-\>\>CM: Store generated summary in section 14  
      
    SGW--\>\>WC: WorkflowResult {\<br/\>  response: "Let me make sure I'm tracking with you...",\<br/\>  summaryGenerated: true,\<br/\>  nextState: SUMMARY\_REVIEW,\<br/\>  clientMdUpdates: {...}\<br/\>}

### **Summary Generator Logic Flow**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#a78bfa'}} }%%  
flowchart TD  
    Start\[Completeness \>= 0.8\] \--\> Gather\[Gather All Checkbox Data from Thread Memory\]  
      
    Gather \--\> Template\[Load Summary Template\<br/\>from SOLUTIONS.md for intent\]  
      
    Template \--\> Context\[Load CLIENT.md Context\<br/\>Sections 2, 3, 5, 10\]  
      
    Context \--\> Structure\[Structure Summary Data\]  
      
    Structure \--\> Build\[Build Summary Prompt\<br/\>Template \+ Data \+ IDENTITY.md \+ PROMPT.md\]  
      
    Build \--\> Generate\[LLM: Generate Natural Summary\]  
      
    Generate \--\> Compliance{Compliance Check\<br/\>via RULES.md}  
      
    Compliance \--\>|✅ Pass| Format\[Format Summary with Confirmation Question\]  
    Compliance \--\>|❌ Fail| Regenerate\[Flag Issues \+ Regenerate\]  
      
    Regenerate \--\> Generate  
      
    Format \--\> UpdateHealth\[Update CLIENT.md Deal Health:\<br/\>painClarityScore \= 9/10\]  
      
    UpdateHealth \--\> Store\[Store Summary in CLIENT.md Section 14\]  
      
    Store \--\> Return\[Return: Summary \+ SUMMARY\_REVIEW state\]  
      
    style Compliance fill:\#a78bfa,stroke:\#7c3aed,stroke-width:3px  
    style Format fill:\#51cf66,stroke:\#37b24d,stroke-width:3px  
    style Regenerate fill:\#fb923c,stroke:\#ea580c,stroke-width:3px

---

## **5️⃣ Objection Handler Workflow**

**Purpose**: Identify objection type and respond with appropriate strategy

**Trigger**: Objection detected at any conversation state

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#fb923c','secondaryColor':'\#51cf66'}} }%%  
sequenceDiagram  
    autonumber  
    participant Customer  
    participant WC as Workflow Controller  
    participant OHW as Objection Handler Workflow  
    participant PB as Prompt Builder  
    participant LLM as Smallest LLM  
    participant TM as Thread Memory  
    participant CM as CLIENT.md  
      
    Note over Customer,CM: During solution proposal  
      
    Customer-\>\>WC: "That sounds expensive."  
      
    WC-\>\>WC: detectObjection("That sounds expensive")\<br/\>→ Pattern match: /expensive|costly|too much/  
      
    WC-\>\>OHW: execute(context)  
      
    rect rgb(251, 146, 60, 0.2)  
    Note over OHW: PHASE 1: Classify Objection Type  
    end  
      
    OHW-\>\>PB: buildObjectionClassificationPrompt({\<br/\>  transcript: "That sounds expensive",\<br/\>  context: "During solution proposal",\<br/\>  clientMd: {...}\<br/\>})  
      
    PB--\>\>OHW: Prompt: "Classify objection type..."  
      
    OHW-\>\>LLM: Classify objection  
      
    LLM--\>\>OHW: {\<br/\>  type: "PRICE\_BUDGET",\<br/\>  severity: 6/10,\<br/\>  underlying\_concern: "ROI uncertainty",\<br/\>  reasoning: "Customer using cost language during proposal"\<br/\>}  
      
    rect rgb(251, 146, 60, 0.2)  
    Note over OHW: PHASE 2: Load Objection Strategy  
    end  
      
    OHW-\>\>OHW: selectStrategy(type: "PRICE\_BUDGET")\<br/\>\<br/\>AGENT.md CASE 6 says:\<br/\>"PRICE\_BUDGET → Value Reframing Workflow\<br/\>Anchor to ROI, check revenue context"  
      
    OHW-\>\>CM: Load section 4 (Metrics)  
    CM--\>\>OHW: Revenue: $15K/month, 3 clients  
      
    OHW-\>\>CM: Load section 2 (Stated Problem)  
    CM--\>\>OHW: "Want better quality leads"  
      
    rect rgb(251, 146, 60, 0.2)  
    Note over OHW: PHASE 3: Build Reframing Response  
    end  
      
    OHW-\>\>PB: buildObjectionResponsePrompt({\<br/\>  objectionType: "PRICE\_BUDGET",\<br/\>  strategy: "value\_reframing",\<br/\>  context: {\<br/\>    currentRevenue: "$15K/month",\<br/\>    clientCount: 3,\<br/\>    desiredOutcome: "better quality leads"\<br/\>  }\<br/\>})  
      
    PB-\>\>PB: Load IDENTITY.md:\<br/\>"Empathetic, consultative"  
      
    PB-\>\>PB: Load AGENT.md objection handling section:\<br/\>"Anchor to value, not cost"  
      
    PB--\>\>OHW: Prompt: "Address price objection by reframing to ROI..."  
      
    OHW-\>\>LLM: Generate reframing response  
      
    LLM--\>\>OHW: "I get that. Let me put it in context. You're doing $15K/month with 3 clients right now. If we solve the lead quality issue and you're able to close just 2 more clients like your current ones, that's $10K/month in new revenue. What would that be worth to you over the next year?"  
      
    rect rgb(251, 146, 60, 0.2)  
    Note over OHW: PHASE 4: Update CLIENT.md  
    end  
      
    OHW-\>\>CM: Update section 7 (Objections):\<br/\>Type: PRICE\_BUDGET\<br/\>Severity: 6/10\<br/\>Strategy used: Value reframing\<br/\>Status: Addressed  
      
    OHW-\>\>CM: Update section 11 (Deal Health):\<br/\>decisionMomentumScore: 6/10 (objection present)\<br/\>overallDealHealth: Recalculate  
      
    OHW-\>\>TM: Store objection event  
      
    OHW--\>\>WC: WorkflowResult {\<br/\>  response: "I get that. Let me put it in context...",\<br/\>  objectionType: "PRICE\_BUDGET",\<br/\>  objectionResolved: false (awaiting response),\<br/\>  nextState: OBJECTION\_HANDLING,\<br/\>  clientMdUpdates: {...}\<br/\>}

### **Objection Handler Decision Tree**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#fb923c'}} }%%  
flowchart TD  
    Start\[Objection Detected\] \--\> Classify\[LLM: Classify Objection Type\]  
      
    Classify \--\> Type{Objection Type?}  
      
    Type \--\>|PRICE\_BUDGET| Strategy1\[Strategy: Value Reframing\]  
    Type \--\>|TIME\_BANDWIDTH| Strategy2\[Strategy: Scope Adjustment\]  
    Type \--\>|TRUST\_SKEPTICISM| Strategy3\[Strategy: Social Proof\]  
    Type \--\>|FIT\_MISALIGNMENT| Strategy4\[Strategy: Discovery Repair\]  
    Type \--\>|AUTHORITY\_DECISION| Strategy5\[Strategy: Stakeholder Mapping\]  
      
    Strategy1 \--\> Context1\[Load CLIENT.md:\<br/\>Current revenue, ROI potential\]  
    Strategy2 \--\> Context2\[Load CLIENT.md:\<br/\>Overwhelm signals, constraints\]  
    Strategy3 \--\> Context3\[Load Case Studies,\<br/\>Testimonials\]  
    Strategy4 \--\> Context4\[Re-evaluate Intent,\<br/\>Return to discovery\]  
    Strategy5 \--\> Context5\[Ask about\<br/\>decision-makers\]  
      
    Context1 \--\> Build1\[Build ROI Anchor Response\]  
    Context2 \--\> Build2\[Build Simplified Proposal\]  
    Context3 \--\> Build3\[Build Credibility Response\]  
    Context4 \--\> Build4\[Build Clarifying Question\]  
    Context5 \--\> Build5\[Build Stakeholder Question\]  
      
    Build1 \--\> Generate\[LLM: Generate Empathetic Response\]  
    Build2 \--\> Generate  
    Build3 \--\> Generate  
    Build4 \--\> Generate  
    Build5 \--\> Generate  
      
    Generate \--\> Update\[Update CLIENT.md Section 7:\<br/\>Objection logged \+ strategy used\]  
      
    Update \--\> Monitor{Objection Resolved?}  
      
    Monitor \--\>|Yes \- Customer satisfied| Return1\[Return to previous state\]  
    Monitor \--\>|Partial \- Still concerned| Stay\[Stay in OBJECTION\_HANDLING\]  
    Monitor \--\>|No \- Blocker| Exit\[Route to Graceful Exit\]  
      
    style Type fill:\#fb923c,stroke:\#ea580c,stroke-width:3px  
    style Strategy1 fill:\#fbbf24,stroke:\#d97706,stroke-width:2px  
    style Strategy2 fill:\#fbbf24,stroke:\#d97706,stroke-width:2px  
    style Strategy3 fill:\#fbbf24,stroke:\#d97706,stroke-width:2px

---

## **6️⃣ Solution Proposal Workflow**

**Purpose**: Present tailored solution based on all discovered context

**Trigger**: Summary approved, ready to propose solution

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#34d399','secondaryColor':'\#51cf66'}} }%%  
sequenceDiagram  
    autonumber  
    participant WC as Workflow Controller  
    participant SPW as Solution Proposal Workflow  
    participant SR as Solutions Registry  
    participant TM as Thread Memory  
    participant CM as CLIENT.md  
    participant PB as Prompt Builder  
    participant LLM as Smallest LLM  
    participant CE as Compliance Engine  
      
    Note over WC,CE: Summary approved: "That's spot on."  
      
    WC-\>\>SPW: execute(context)  
      
    rect rgb(52, 211, 153, 0.2)  
    Note over SPW: PHASE 1: Load Solution Template  
    end  
      
    SPW-\>\>TM: getIntentLock()  
    TM--\>\>SPW: {intent: "ECOSYSTEM\_MAPPING\_INQUIRY"}  
      
    SPW-\>\>SR: getSolutionProposal("ECOSYSTEM\_MAPPING\_INQUIRY")  
    SR--\>\>SPW: Template from SOLUTIONS.md:\<br/\>"Based on what you've shared, here's what I'd suggest:\<br/\>We'd start with ecosystem mapping—looking at what exists\<br/\>across all {channels} during hot vs cold weeks..."  
      
    rect rgb(52, 211, 153, 0.2)  
    Note over SPW: PHASE 2: Gather Complete Context  
    end  
      
    SPW-\>\>CM: load()  
    CM--\>\>SPW: Complete CLIENT.md:\<br/\>- Section 2: Stated Problem\<br/\>- Section 3: Inferred Core Problem\<br/\>- Section 4: Current State Metrics\<br/\>- Section 10: Strategic Levers\<br/\>- Section 11: Deal Health  
      
    SPW-\>\>TM: getAllCheckboxes()  
    TM--\>\>SPW: Full discovery data  
      
    rect rgb(52, 211, 153, 0.2)  
    Note over SPW: PHASE 3: Build Proposal Structure  
    end  
      
    SPW-\>\>SPW: structureProposal()\<br/\>\<br/\>Components:\<br/\>1. Problem Restatement (their words)\<br/\>2. Strategic Approach (how to solve)\<br/\>3. Expected Outcome (tied to their goals)\<br/\>4. Investment (if pricing intent)\<br/\>5. Next Steps (permission-based)  
      
    rect rgb(52, 211, 153, 0.2)  
    Note over SPW: PHASE 4: Generate Tailored Proposal  
    end  
      
    SPW-\>\>PB: buildProposalPrompt({\<br/\>  template: "Based on what you've shared...",\<br/\>  clientMd: {...},\<br/\>  checkboxData: \[...\],\<br/\>  structure: {...}\<br/\>})  
      
    PB-\>\>PB: Load IDENTITY.md:\<br/\>"Consultative, permission-based"  
      
    PB-\>\>PB: Load PROMPT.md:\<br/\>Proposal template section  
      
    PB--\>\>SPW: Assembled prompt  
      
    SPW-\>\>LLM: Generate proposal  
      
    LLM--\>\>SPW: Draft proposal:\<br/\>"Based on what you've shared, here's what I'd suggest:\<br/\>We'd start with ecosystem mapping—looking at what exists across all 9 channels during your hot weeks versus cold weeks. Instead of just tracking conversion rate, we'd measure predictive signals like reply time, message depth, and hesitation points. The goal is to find the invisible friction between your ROI ads and brand-focused organic that's causing the conversion drop. Does that sound like what would help?"  
      
    rect rgb(52, 211, 153, 0.2)  
    Note over SPW: PHASE 5: Compliance Validation  
    end  
      
    SPW-\>\>CE: validate(proposal)  
      
    CE-\>\>CE: Check RULES.md:\<br/\>✓ No guarantees ("will fix")\<br/\>✓ No over-promising\<br/\>✓ Permission-based ending\<br/\>✓ Realistic outcomes  
      
    CE--\>\>SPW: ✅ Compliant  
      
    rect rgb(52, 211, 153, 0.2)  
    Note over SPW: PHASE 6: Update CLIENT.md  
    end  
      
    SPW-\>\>CM: Update section 11 (Deal Health):\<br/\>solutionFitScore: 8/10\<br/\>decisionMomentumScore: Calculate based on response\<br/\>overallDealHealth: 8/10  
      
    SPW-\>\>CM: Update section 13 (Conversation History):\<br/\>Breakthrough moment: "Solution proposal presented"  
      
    SPW-\>\>CM: Store proposal in section 14  
      
    SPW--\>\>WC: WorkflowResult {\<br/\>  response: "Based on what you've shared...",\<br/\>  proposalPresented: true,\<br/\>  nextState: INTENT\_RESOLUTION,\<br/\>  awaitingBuyingSignal: true,\<br/\>  clientMdUpdates: {...}\<br/\>}

### **Solution Proposal Structure**

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#34d399'}} }%%  
flowchart TD  
    Start\[Summary Approved\] \--\> Load\[Load Solution Template\<br/\>from SOLUTIONS.md\]  
      
    Load \--\> Context\[Gather Complete Context\<br/\>CLIENT.md \+ Checkboxes \+ Thread Memory\]  
      
    Context \--\> Structure\[Build Proposal Structure\]  
      
    Structure \--\> P1\[1. Problem Restatement\<br/\>Use customer's exact words\<br/\>from CLIENT.md Section 2\]  
      
    P1 \--\> P2\[2. Strategic Approach\<br/\>How you'll solve it\<br/\>Based on intent \+ checkboxes\]  
      
    P2 \--\> P3\[3. Expected Outcome\<br/\>Tied to their stated goals\<br/\>from CLIENT.md Section 2, 4\]  
      
    P3 \--\> P4\[4. Investment/Structure\<br/\>Only if PRICING\_INQUIRY intent\<br/\>Value-based framing\]  
      
    P4 \--\> P5\[5. Permission-Based Next Step\<br/\>Ask don't tell\<br/\>"Does that sound like what would help?"\]  
      
    P5 \--\> Generate\[LLM: Generate Natural Proposal\<br/\>using IDENTITY.md \+ PROMPT.md\]  
      
    Generate \--\> Validate\[Compliance Engine:\<br/\>Check against RULES.md\]  
      
    Validate \--\> Update\[Update CLIENT.md\<br/\>Section 11: Deal Health scores\<br/\>Section 13: Proposal presented\]  
      
    Update \--\> Return\[Return: Proposal \+ INTENT\_RESOLUTION state\]  
      
    style Structure fill:\#34d399,stroke:\#059669,stroke-width:3px  
    style P1 fill:\#6ee7b7,stroke:\#059669,stroke-width:2px  
    style P2 fill:\#6ee7b7,stroke:\#059669,stroke-width:2px  
    style P3 fill:\#6ee7b7,stroke:\#059669,stroke-width:2px  
    style P4 fill:\#6ee7b7,stroke:\#059669,stroke-width:2px  
    style P5 fill:\#6ee7b7,stroke:\#059669,stroke-width:2px

---

## **7️⃣ Clarification Workflow**

**Purpose**: Handle ambiguous or uncertain responses

**Trigger**: Customer gives vague response ("maybe", "I guess", "sort of")

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#fbbf24'}} }%%  
flowchart TD  
    Start\[Ambiguous Response Detected\] \--\> Analyze\[Analyze Ambiguity Type\]  
      
    Analyze \--\> Type{Ambiguity Type?}  
      
    Type \--\>|UNCERTAIN INTENT\<br/\>"Maybe..."| Strategy1\[Rephrase Intent\<br/\>with More Context\]  
    Type \--\>|PARTIAL UNDERSTANDING\<br/\>"Kind of..."| Strategy2\[Ask Specific\<br/\>Clarifying Question\]  
    Type \--\>|CONFUSION\<br/\>"I don't understand"| Strategy3\[Simplify & Re-explain\]  
    Type \--\>|MULTIPLE OPTIONS\<br/\>"Both A and B"| Strategy4\[Help Prioritize\]  
      
    Strategy1 \--\> Build1\[Build Elaborated\<br/\>Intent Confirmation\]  
    Strategy2 \--\> Build2\[Build Targeted\<br/\>Clarification\]  
    Strategy3 \--\> Build3\[Build Simplified\<br/\>Explanation\]  
    Strategy4 \--\> Build4\[Build Prioritization\<br/\>Question\]  
      
    Build1 \--\> Generate\[LLM: Generate Clarification\<br/\>using IDENTITY.md consultative tone\]  
    Build2 \--\> Generate  
    Build3 \--\> Generate  
    Build4 \--\> Generate  
      
    Generate \--\> Update\[Update CLIENT.md\<br/\>Section 9: Discovery Gaps\]  
      
    Update \--\> Return\[Return: Clarification \+ Stay in Current State\]  
      
    style Type fill:\#fbbf24,stroke:\#d97706,stroke-width:3px

---

## **8️⃣ Conversation Repair Workflow**

**Purpose**: Handle confusion, misalignment, or explicit corrections

**Trigger**: Customer says "I'm lost", "wait", or explicit correction

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#f87171'}} }%%  
flowchart TD  
    Start\[Confusion/Misalignment Detected\] \--\> Analyze\[Analyze Conversation History\<br/\>CLIENT.md Section 13\]  
      
    Analyze \--\> Find\[Identify Last Point of Agreement\]  
      
    Find \--\> Strategy{Repair Strategy?}  
      
    Strategy \--\>|MINOR CORRECTION\<br/\>"No, I meant..."| Quick\[Acknowledge \+ Correct\]  
    Strategy \--\>|MAJOR MISUNDERSTANDING\<br/\>"That's not what I said"| Full\[Full Context Reset\]  
    Strategy \--\>|LOST THREAD\<br/\>"What were we talking about?"| Recap\[Brief Recap \+ Redirect\]  
      
    Quick \--\> Build1\[Build Acknowledgment\<br/\>"Ah, I misunderstood..."\]  
    Full \--\> Build2\[Build Complete Reset\<br/\>"Let me back up..."\]  
    Recap \--\> Build3\[Build Brief Summary\<br/\>"We were discussing..."\]  
      
    Build1 \--\> Generate\[LLM: Generate Repair Response\]  
    Build2 \--\> Generate  
    Build3 \--\> Generate  
      
    Generate \--\> Clear\[Clear Confused State Markers\<br/\>in Thread Memory\]  
      
    Clear \--\> Restore\[Restore to Last Valid State\]  
      
    Restore \--\> Update\[Update CLIENT.md\<br/\>Section 9: Note what caused confusion\]  
      
    Update \--\> Return\[Return: Repair \+ Restored State\]  
      
    style Strategy fill:\#f87171,stroke:\#dc2626,stroke-width:3px  
    style Full fill:\#fb923c,stroke:\#ea580c,stroke-width:2px

---

## **🔄 Workflow Interaction Map**

How workflows hand off to each other:

%%{init: {'theme':'base','themeVariables':{'primaryColor':'\#51cf66'}} }%%  
stateDiagram-v2  
    \[\*\] \--\> IntentRouter: Call starts  
      
    IntentRouter \--\> IntentConfirmation: Intent detected (conf \>= 0.75)  
    IntentRouter \--\> Clarification: Intent unclear (conf \< 0.75)  
      
    IntentConfirmation \--\> SolutionExplorer: Customer confirms  
    IntentConfirmation \--\> IntentRouter: Customer rejects  
    IntentConfirmation \--\> Clarification: Customer uncertain  
      
    SolutionExplorer \--\> SolutionExplorer: Completeness \< 0.8  
    SolutionExplorer \--\> SummaryGenerator: Completeness \>= 0.8  
    SolutionExplorer \--\> ObjectionHandler: Objection detected  
      
    SummaryGenerator \--\> SolutionProposal: Summary approved  
    SummaryGenerator \--\> SolutionExplorer: Summary needs correction  
    SummaryGenerator \--\> ObjectionHandler: Objection during summary  
      
    ObjectionHandler \--\> SolutionExplorer: Objection resolved, continue discovery  
    ObjectionHandler \--\> SummaryGenerator: Objection resolved, ready for summary  
    ObjectionHandler \--\> SolutionProposal: Objection resolved, ready for proposal  
    ObjectionHandler \--\> \[\*\]: Unresolvable blocker  
      
    SolutionProposal \--\> \[\*\]: Customer buys / next steps agreed  
    SolutionProposal \--\> ObjectionHandler: New objection  
    SolutionProposal \--\> Clarification: Customer has questions  
      
    Clarification \--\> IntentRouter: Clarified, restart intent detection  
    Clarification \--\> SolutionExplorer: Clarified, continue discovery  
    Clarification \--\> SummaryGenerator: Clarified, ready for summary  
      
    state "Any State" as AnyState  
    AnyState \--\> ConversationRepair: Explicit confusion  
    ConversationRepair \--\> IntentRouter: Reset to start  
    ConversationRepair \--\> SolutionExplorer: Reset to discovery

---

## **✅ Summary: Mastra Workflow System**

| Workflow | Input | LLM Task | Output | Next State |
| ----- | ----- | ----- | ----- | ----- |
| **Intent Router** | Customer transcript | Classify intent against SOLUTIONS.md triggers | Detected intent \+ confirmation question | INTENT\_CONFIRMATION |
| **Intent Confirmation** | Customer yes/no response | Parse confirmation type | Lock intent \+ first discovery question | SOLUTION\_EXPLORATION |
| **Solution Explorer** | Customer answer to checkbox question | Extract data \+ generate next question | Updated checkbox \+ next question | SOLUTION\_EXPLORATION (or SUMMARY\_REVIEW if complete) |
| **Summary Generator** | All checkbox data | Create structured summary | Natural language summary | SUMMARY\_REVIEW |
| **Objection Handler** | Objection statement | Classify type \+ generate reframing | Empathetic objection response | OBJECTION\_HANDLING (or return to previous state) |
| **Solution Proposal** | Approved summary \+ CLIENT.md | Generate tailored proposal | Permission-based proposal | INTENT\_RESOLUTION |
| **Clarification** | Ambiguous response | Generate targeted clarification | Clarifying question | Stay in current state |
| **Conversation Repair** | Confusion signal | Analyze history \+ generate reset | Context reset response | Restore to last valid state |

All workflows follow the same pattern:

1. **Receive context** from Workflow Controller  
2. **Build prompt** via Prompt Builder  
3. **Call LLM** for generation/classification  
4. **Update CLIENT.md** with new insights  
5. **Return result** to Workflow Controller

Would you like me to create implementation code for any of these workflows next?

