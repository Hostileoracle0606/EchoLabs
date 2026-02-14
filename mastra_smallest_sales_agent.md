# AI Sales Agent: Mastra.ai + Smallest.ai Architecture
## Production-Ready Conversational Sales System

---

## Executive Summary

This architecture leverages **Mastra.ai** for multi-agent orchestration and workflow management, combined with **Smallest.ai** for ultra-low-latency voice synthesis and recognition. This creates a complete, production-ready conversational AI sales agent capable of conducting autonomous sales calls.

**Key Technology Stack:**
- **Mastra.ai**: Agent framework, workflows, memory management, tool orchestration
- **Smallest.ai**: Voice synthesis (100ms TTS), speech recognition, real-time conversation
- **Supporting**: Pinecone (knowledge), PostgreSQL (CRM data), Redis (session state)

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CUSTOMER INTERACTION                      │
│                  (Phone/WebRTC/SIP Trunk)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SMALLEST.AI VOICE LAYER                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   ATOMS      │  │   WAVES      │  │  Lightning   │      │
│  │ (STT/Agent)  │  │    (TTS)     │  │   (Speed)    │      │
│  │  Real-time   │  │  100ms       │  │   10s/100ms  │      │
│  │  Transcribe  │  │  Synthesis   │  │   Inference  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   MASTRA.AI AGENT LAYER                      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          SALES CONVERSATION DIRECTOR AGENT           │   │
│  │  (Orchestrates all other agents and workflows)       │   │
│  └─────────────┬────────────────────────────────────────┘   │
│                │                                              │
│       ┌────────┴────────┬──────────┬───────────┬────────┐   │
│       ▼                 ▼          ▼           ▼        ▼   │
│  ┌─────────┐      ┌─────────┐ ┌─────────┐ ┌─────────┐ ...  │
│  │ Product │      │Objection│ │Qualifier│ │Negotiator│     │
│  │ Expert  │      │ Handler │ │  Agent  │ │  Agent   │     │
│  │ Agent   │      │  Agent  │ │         │ │          │     │
│  └─────────┘      └─────────┘ └─────────┘ └─────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               MASTRA WORKFLOWS                        │   │
│  │  • Discovery Workflow  • Demo Workflow               │   │
│  │  • Objection Handling  • Closing Workflow            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               MASTRA TOOLS                            │   │
│  │  • CRM Tools  • Knowledge Base  • Calendar           │   │
│  │  • Analytics  • Pricing Engine  • Email              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           MASTRA MEMORY & CONTEXT                     │   │
│  │  • Thread-based conversation memory                  │   │
│  │  • Customer profile & history                        │   │
│  │  • Semantic recall from past interactions            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA & INTEGRATION LAYER                   │
│  ┌─────────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Pinecone   │  │PostgreSQL│  │  Redis   │  │Salesforce│ │
│  │  (Vector    │  │  (CRM)   │  │ (Session)│  │  (CRM)   │  │
│  │   Store)    │  │          │  │          │  │          │  │
│  └─────────────┘  └──────────┘  └──────────┘  └─────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 1: Smallest.ai Voice Infrastructure

### Why Smallest.ai?

Smallest.ai owns the entire voice stack:
- **100ms TTS latency** (vs 2s industry standard)
- **10 seconds of speech in 100ms** using Lightning model
- **Sub-100ms processing** for real-time conversations
- **$0.01/minute** cost (vs $0.20 industry standard)
- **On-premise deployment** for compliance
- **Multi-language support** (16+ languages)

### Voice Pipeline Configuration

```typescript
// src/voice/smallest-voice-pipeline.ts
import { SmallestAI } from '@smallest/sdk';

export class SmallestVoicePipeline {
  private smallest: SmallestAI;
  private activeConversations: Map<string, ConversationSession>;
  
  constructor() {
    this.smallest = new SmallestAI({
      apiKey: process.env.SMALLEST_API_KEY,
      region: 'us-west-2'
    });
    this.activeConversations = new Map();
  }
  
  /**
   * Initialize a new conversation session
   */
  async startConversation(sessionId: string, phoneNumber: string) {
    const session = await this.smallest.atoms.createSession({
      sessionId,
      phoneNumber,
      voice: {
        id: 'professional-sales-male', // or use custom voice
        speed: 1.0,
        emotionality: 0.7, // Natural emotional range
        pauseBetweenSentences: 300 // ms
      },
      stt: {
        language: 'en-US',
        model: 'electron', // Smallest's fast STT model
        enablePartialResults: true,
        endpointingDelay: 700 // ms of silence before end-of-turn
      }
    });
    
    this.activeConversations.set(sessionId, session);
    return session;
  }
  
  /**
   * Stream audio from customer and get transcripts
   */
  async transcribeStream(sessionId: string, audioStream: ReadableStream) {
    const session = this.activeConversations.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    // Smallest handles streaming transcription with ultra-low latency
    const transcriptStream = session.transcribe(audioStream, {
      onPartial: (text) => {
        // Emit partial transcripts for faster response
        this.emit('partial_transcript', { sessionId, text, isFinal: false });
      },
      onFinal: (text, confidence) => {
        // Final transcript with high confidence
        this.emit('final_transcript', { 
          sessionId, 
          text, 
          confidence,
          isFinal: true 
        });
      },
      onEndOfSpeech: () => {
        this.emit('end_of_speech', { sessionId });
      }
    });
    
    return transcriptStream;
  }
  
  /**
   * Generate speech from text with ultra-low latency
   */
  async synthesize(sessionId: string, text: string, options?: {
    emotion?: 'neutral' | 'enthusiastic' | 'empathetic' | 'confident';
    urgency?: number; // 0-1
    emphasize?: string[]; // words to emphasize
  }) {
    const session = this.activeConversations.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    // Use Smallest's WAVES for ultra-fast TTS (100ms latency)
    const audioStream = await this.smallest.waves.synthesize({
      text,
      voiceId: session.voice.id,
      sampleRate: 24000, // High quality
      emotion: options?.emotion || 'neutral',
      ssml: this.generateSSML(text, options),
      streaming: true // Stream audio as it's generated
    });
    
    return audioStream;
  }
  
  /**
   * Generate SSML for enhanced prosody
   */
  private generateSSML(text: string, options?: any): string {
    let ssml = `<speak>`;
    
    // Add emotion tags
    if (options?.emotion === 'enthusiastic') {
      ssml += `<prosody rate="105%" pitch="+5%">`;
    } else if (options?.emotion === 'empathetic') {
      ssml += `<prosody rate="95%" pitch="-2%">`;
    }
    
    // Add emphasis to specific words
    if (options?.emphasize) {
      let processedText = text;
      options.emphasize.forEach(word => {
        processedText = processedText.replace(
          new RegExp(`\\b${word}\\b`, 'gi'),
          `<emphasis level="strong">${word}</emphasis>`
        );
      });
      ssml += processedText;
    } else {
      ssml += text;
    }
    
    if (options?.emotion) {
      ssml += `</prosody>`;
    }
    
    ssml += `</speak>`;
    return ssml;
  }
  
  /**
   * Handle interruptions (barge-in)
   */
  async handleInterrupt(sessionId: string) {
    const session = this.activeConversations.get(sessionId);
    if (!session) return;
    
    // Smallest.ai has native barge-in support
    await session.interruptCurrentSpeech();
    this.emit('interrupted', { sessionId });
  }
}
```

---

## Part 2: Mastra.ai Agent Framework

### Why Mastra.ai?

Mastra.ai provides:
- **Multi-agent orchestration** with sub-agents
- **Workflow engine** for complex conversation flows
- **Built-in memory** (thread-based, semantic)
- **Tool system** for CRM, knowledge base, etc.
- **RAG integration** out of the box
- **Observability** with tracing and logging
- **MCP support** for extensibility

### Main Sales Conversation Director Agent

```typescript
// src/mastra/agents/sales-director.ts
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const salesDirectorAgent = new Agent({
  id: 'sales-director',
  name: 'Sales Conversation Director',
  
  instructions: `You are an experienced B2B sales director orchestrating a sales conversation.

YOUR ROLE:
- Decide conversation strategy based on customer signals
- Route to specialized sub-agents when needed
- Maintain natural conversation flow
- Balance rapport, discovery, and closing

CONVERSATION STAGES:
1. Opening (build rapport, get permission)
2. Discovery (understand needs, pain points)
3. Presentation (match solutions to needs)
4. Objection Handling (address concerns)
5. Closing (secure next steps)

DECISION RULES:
- If customer asks product questions → route to Product Expert
- If objection detected → route to Objection Handler
- If buying signals strong → route to Closing Agent
- If budget/authority unclear → route to Qualifier Agent
- Otherwise → continue discovery

PERSONALITY:
- Professional but warm
- Consultative, not pushy
- Great listener
- Strategic thinker
- Natural conversationalist`,

  model: {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20241022',
    toolChoice: 'auto'
  },
  
  // Sub-agents as tools
  agents: {
    productExpert: 'product-expert',
    objectionHandler: 'objection-handler',
    qualifierAgent: 'qualifier-agent',
    closingAgent: 'closing-agent',
    negotiatorAgent: 'negotiator-agent'
  },
  
  // Workflows as tools
  workflows: {
    discoveryWorkflow: 'discovery-workflow',
    demoWorkflow: 'demo-workflow',
    objectionWorkflow: 'objection-workflow'
  },
  
  // Custom tools
  tools: {
    detectBuyingSignals: createTool({
      id: 'detect-buying-signals',
      description: 'Detect buying signals in customer speech',
      inputSchema: z.object({
        transcript: z.string(),
        context: z.object({
          stage: z.string(),
          painPointsIdentified: z.number()
        })
      }),
      execute: async ({ context }) => {
        // Buying signal patterns
        const signals = {
          direct: [
            /when can we start/i,
            /how do we get started/i,
            /what's the next step/i,
            /send me the contract/i
          ],
          indirect: [
            /how long.*implementation/i,
            /what about onboarding/i,
            /who would be our account manager/i,
            /integration with/i
          ],
          timeline: [
            /this quarter/i,
            /by end of month/i,
            /asap/i,
            /urgently/i
          ]
        };
        
        let score = 0;
        let detectedSignals = [];
        
        for (const [type, patterns] of Object.entries(signals)) {
          for (const pattern of patterns) {
            if (pattern.test(context.transcript)) {
              score += type === 'direct' ? 10 : type === 'timeline' ? 7 : 5;
              detectedSignals.push(type);
            }
          }
        }
        
        return {
          score,
          strength: score > 15 ? 'strong' : score > 7 ? 'moderate' : 'weak',
          signals: detectedSignals,
          recommendation: score > 15 ? 'move_to_close' : 'continue_discovery'
        };
      }
    }),
    
    detectObjection: createTool({
      id: 'detect-objection',
      description: 'Detect and classify objections',
      inputSchema: z.object({
        transcript: z.string()
      }),
      execute: async ({ context }) => {
        const objectionPatterns = {
          price: /too expensive|budget|cost|price|afford/i,
          timing: /not right now|later|next quarter|busy/i,
          authority: /need to check|talk to|boss|team/i,
          competition: /already use|working with|competitor/i,
          value: /not sure|don't see|why do we need/i,
          trust: /never heard of|concerns about|security/i
        };
        
        for (const [type, pattern] of Object.entries(objectionPatterns)) {
          if (pattern.test(context.transcript)) {
            return {
              detected: true,
              type,
              severity: this.assessSeverity(context.transcript),
              requiresImmediate: type === 'price' || type === 'value'
            };
          }
        }
        
        return { detected: false };
      }
    }),
    
    updateCRM: createTool({
      id: 'update-crm',
      description: 'Update CRM with conversation insights',
      inputSchema: z.object({
        opportunityId: z.string(),
        updates: z.object({
          painPoints: z.array(z.string()).optional(),
          buyingSignals: z.array(z.string()).optional(),
          objections: z.array(z.string()).optional(),
          nextSteps: z.array(z.string()).optional(),
          dealStage: z.string().optional()
        })
      }),
      execute: async ({ context }) => {
        // CRM integration logic
        await salesforceClient.updateOpportunity(
          context.opportunityId,
          context.updates
        );
        return { success: true };
      }
    })
  }
});
```

### Sub-Agent: Product Expert

```typescript
// src/mastra/agents/product-expert.ts
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const productExpertAgent = new Agent({
  id: 'product-expert',
  name: 'Product Knowledge Expert',
  
  instructions: `You are a product expert who knows everything about our solutions.

YOUR ROLE:
- Answer product questions accurately
- Match features to customer needs
- Provide ROI data and case studies
- Handle technical questions

KNOWLEDGE SOURCES:
- Product documentation (via knowledge base tool)
- Case studies (via RAG tool)
- Competitive positioning (via competitive intel tool)
- Pricing structure (via pricing tool)

COMMUNICATION STYLE:
- Clear and concise
- Technical when appropriate, simple when not
- Always tie features to benefits
- Use customer's industry language`,

  model: {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20241022'
  },
  
  tools: {
    searchKnowledgeBase: createTool({
      id: 'search-knowledge-base',
      description: 'Search product knowledge base',
      inputSchema: z.object({
        query: z.string(),
        filters: z.object({
          category: z.string().optional(),
          industry: z.string().optional()
        }).optional()
      }),
      execute: async ({ context }) => {
        // Pinecone vector search
        const results = await pineconeIndex.query({
          vector: await getEmbedding(context.query),
          topK: 5,
          filter: context.filters,
          includeMetadata: true
        });
        
        return {
          results: results.matches.map(match => ({
            content: match.metadata.content,
            title: match.metadata.title,
            relevance: match.score
          }))
        };
      }
    }),
    
    getCaseStudy: createTool({
      id: 'get-case-study',
      description: 'Get relevant case study',
      inputSchema: z.object({
        industry: z.string(),
        useCase: z.string()
      }),
      execute: async ({ context }) => {
        // Fetch matching case study
        const caseStudy = await db.caseStudies.findFirst({
          where: {
            industry: context.industry,
            tags: { has: context.useCase }
          },
          orderBy: { relevance: 'desc' }
        });
        
        return {
          company: caseStudy.companyName,
          challenge: caseStudy.challenge,
          solution: caseStudy.solution,
          results: caseStudy.results,
          timeline: caseStudy.timeline
        };
      }
    }),
    
    getCompetitiveIntel: createTool({
      id: 'get-competitive-intel',
      description: 'Get competitive differentiation',
      inputSchema: z.object({
        competitor: z.string()
      }),
      execute: async ({ context }) => {
        const intel = await db.competitive.findUnique({
          where: { competitor: context.competitor }
        });
        
        return {
          ourAdvantages: intel.advantages,
          theirWeaknesses: intel.weaknesses,
          battleCard: intel.battleCard,
          winningMessage: intel.messaging
        };
      }
    })
  }
});
```

### Sub-Agent: Objection Handler

```typescript
// src/mastra/agents/objection-handler.ts
import { Agent } from '@mastra/core/agent';

export const objectionHandlerAgent = new Agent({
  id: 'objection-handler',
  name: 'Objection Handler',
  
  instructions: `You are a master at handling sales objections with empathy and logic.

OBJECTION HANDLING FRAMEWORK:
1. Listen & Acknowledge
2. Clarify & Understand
3. Isolate (is this the only concern?)
4. Address with proof
5. Confirm resolution

OBJECTION TYPES & STRATEGIES:

PRICE OBJECTIONS:
- Reframe to ROI and value
- Break down cost vs. cost of inaction
- Offer payment flexibility
- Use case studies with concrete ROI

TIMING OBJECTIONS:
- Uncover real reason (often hiding another objection)
- Create urgency with cost of delay
- Offer pilot or phased approach

AUTHORITY OBJECTIONS:
- Coach them to sell internally
- Offer to present to decision maker
- Provide champion materials

COMPETITION OBJECTIONS:
- Respect competitor
- Differentiate on value, not price
- Use proof points

VALUE OBJECTIONS:
- These are discovery failures - go back to needs
- Quantify the pain
- Show concrete examples

TRUST OBJECTIONS:
- Provide social proof
- Offer references
- Share security/compliance docs

TONE:
- Empathetic and understanding
- Never defensive
- Consultative
- Patient`,

  model: {
    provider: 'anthropic',
    name: 'claude-3-5-sonnet-20241022'
  }
});
```

---

## Part 3: Mastra Workflows

### Discovery Workflow

```typescript
// src/mastra/workflows/discovery-workflow.ts
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';

const gatherSituationStep = createStep({
  id: 'gather-situation',
  description: 'Understand current situation',
  
  execute: async ({ context, mastra }) => {
    const agent = mastra.getAgent('sales-director');
    
    const questions = [
      "Can you tell me a bit about your current process for {relevant_area}?",
      "What tools or solutions are you currently using?",
      "How is your team handling this today?"
    ];
    
    // Agent asks situational questions
    const response = await agent.generate({
      messages: [
        {
          role: 'system',
          content: 'Ask situational questions to understand current state'
        },
        {
          role: 'user',
          content: context.customerResponse
        }
      ]
    });
    
    return {
      situationUnderstood: true,
      currentTools: context.extractedEntities.tools,
      teamSize: context.extractedEntities.teamSize
    };
  }
});

const identifyPainPointsStep = createStep({
  id: 'identify-pain-points',
  description: 'Dig into pain points and challenges',
  
  execute: async ({ context, mastra }) => {
    const agent = mastra.getAgent('sales-director');
    
    const questions = [
      "What's your biggest challenge with {area}?",
      "How is this affecting your team's productivity?",
      "What would it mean for your business if you could solve this?"
    ];
    
    // Extract and categorize pain points
    const painPoints = await this.analyzePainPoints(context);
    
    return {
      painPoints,
      severity: this.calculatePainSeverity(painPoints),
      impact: this.quantifyImpact(painPoints)
    };
  }
});

const buildUrgencyStep = createStep({
  id: 'build-urgency',
  description: 'Quantify impact and create urgency',
  
  execute: async ({ context, mastra }) => {
    // Calculate cost of inaction
    const costOfInaction = {
      timeWasted: context.painPoints.timeImpact,
      revenueLost: context.painPoints.revenueImpact,
      opportunityCost: context.painPoints.opportunityImpact
    };
    
    return {
      urgencyScore: this.calculateUrgency(costOfInaction),
      readyForSolution: context.urgencyScore > 70
    };
  }
});

export const discoveryWorkflow = createWorkflow({
  id: 'discovery-workflow',
  name: 'Sales Discovery Workflow',
  
  inputSchema: z.object({
    customerId: z.string(),
    initialResponse: z.string(),
    context: z.any()
  }),
  
  steps: [
    gatherSituationStep,
    identifyPainPointsStep,
    buildUrgencyStep
  ],
  
  // Workflow can branch based on results
  routing: {
    buildUrgencyStep: {
      onComplete: ({ results }) => {
        if (results.readyForSolution) {
          return 'presentation-workflow';
        } else {
          return 'nurture-workflow';
        }
      }
    }
  }
});
```

---

## Part 4: Integration Layer

### Mastra Server with Smallest.ai Voice

```typescript
// src/server.ts
import { Mastra } from '@mastra/core';
import { SmallestVoicePipeline } from './voice/smallest-voice-pipeline';
import { salesDirectorAgent } from './mastra/agents/sales-director';
import { productExpertAgent } from './mastra/agents/product-expert';
import { objectionHandlerAgent } from './mastra/agents/objection-handler';
import { discoveryWorkflow } from './mastra/workflows/discovery-workflow';

// Initialize Mastra
export const mastra = new Mastra({
  agents: {
    salesDirector: salesDirectorAgent,
    productExpert: productExpertAgent,
    objectionHandler: objectionHandlerAgent,
    // ... other agents
  },
  
  workflows: {
    discoveryWorkflow,
    // ... other workflows
  },
  
  // Memory configuration
  memory: {
    provider: 'libsql',
    config: {
      url: process.env.DATABASE_URL
    }
  },
  
  // Observability
  logger: {
    level: 'info',
    destination: './logs/mastra.log'
  },
  
  // Telemetry
  telemetry: {
    serviceName: 'sales-agent',
    exporters: ['console', 'datadog']
  }
});

// Initialize Smallest.ai voice pipeline
const voicePipeline = new SmallestVoicePipeline();

// WebSocket server for real-time conversation
import { Server } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

io.on('connection', async (socket) => {
  const sessionId = socket.handshake.query.sessionId as string;
  const customerId = socket.handshake.query.customerId as string;
  
  console.log(`[${sessionId}] Customer connected`);
  
  // Start voice session with Smallest.ai
  const voiceSession = await voicePipeline.startConversation(
    sessionId,
    socket.handshake.query.phoneNumber as string
  );
  
  // Get Mastra agent
  const agent = mastra.getAgent('salesDirector');
  
  // Initialize conversation memory
  const threadId = `conversation-${sessionId}`;
  
  // Listen for customer audio
  socket.on('audio_chunk', async (audioData: Buffer) => {
    // Send to Smallest.ai for transcription
    voiceSession.transcribe(audioData);
  });
  
  // Handle transcripts from Smallest.ai
  voicePipeline.on('final_transcript', async ({ sessionId: sid, text }) => {
    if (sid !== sessionId) return;
    
    console.log(`[${sessionId}] Customer: ${text}`);
    
    // Send to Mastra agent for processing
    const response = await agent.generate({
      messages: [
        { role: 'user', content: text }
      ],
      threadId, // Mastra handles memory automatically
      resourceId: customerId
    });
    
    console.log(`[${sessionId}] Agent: ${response.text}`);
    
    // Convert response to speech with Smallest.ai
    const audioStream = await voicePipeline.synthesize(
      sessionId,
      response.text,
      {
        emotion: determineEmotion(response.metadata),
        emphasize: extractKeyWords(response.text)
      }
    );
    
    // Stream audio back to customer
    audioStream.on('data', (chunk) => {
      socket.emit('agent_audio', chunk);
    });
    
    // Send transcript for UI
    socket.emit('agent_transcript', response.text);
  });
  
  // Handle customer interruption
  socket.on('interrupt', async () => {
    await voicePipeline.handleInterrupt(sessionId);
  });
  
  // Handle disconnection
  socket.on('disconnect', async () => {
    console.log(`[${sessionId}] Customer disconnected`);
    await voiceSession.end();
  });
});

httpServer.listen(3000, () => {
  console.log('AI Sales Agent server running on port 3000');
});

// Helper functions
function determineEmotion(metadata: any): string {
  if (metadata.dealStage === 'closing') return 'enthusiastic';
  if (metadata.objectionDetected) return 'empathetic';
  return 'confident';
}

function extractKeyWords(text: string): string[] {
  // Extract important words to emphasize
  const keyPhrases = [
    /\b(save|increase|improve|reduce)\s+\d+%/gi,
    /\$[\d,]+/g,
    /\b(guarantee|proven|certified)\b/gi
  ];
  
  const words: string[] = [];
  keyPhrases.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) words.push(...matches);
  });
  
  return words;
}
```

---

## Part 5: Mastra Memory & Context Management

```typescript
// Mastra automatically handles memory with thread-based storage

// Example: Accessing conversation history
const conversationHistory = await mastra.memory.getThread({
  threadId: `conversation-${sessionId}`,
  resourceId: customerId,
  lastMessages: 10 // Get last 10 exchanges
});

// Example: Semantic search across past conversations
const relevantContext = await mastra.memory.search({
  query: "previous objections about pricing",
  threadId: `conversation-${sessionId}`,
  limit: 3
});

// Mastra's memory automatically:
// - Stores all messages in thread
// - Creates embeddings for semantic search
// - Maintains conversation context
// - Supports retrieval by time, similarity, or both
```

---

## Part 6: Tool Integration Examples

### CRM Tool (Salesforce)

```typescript
// src/mastra/tools/salesforce-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import jsforce from 'jsforce';

const salesforceConn = new jsforce.Connection({
  loginUrl: process.env.SALESFORCE_LOGIN_URL
});

await salesforceConn.login(
  process.env.SALESFORCE_USERNAME!,
  process.env.SALESFORCE_PASSWORD!
);

export const updateOpportunityTool = createTool({
  id: 'update-salesforce-opportunity',
  description: 'Update opportunity in Salesforce CRM',
  
  inputSchema: z.object({
    opportunityId: z.string(),
    updates: z.object({
      stage: z.string().optional(),
      probability: z.number().optional(),
      painPoints: z.array(z.string()).optional(),
      nextSteps: z.string().optional(),
      notes: z.string().optional()
    })
  }),
  
  execute: async ({ context }) => {
    await salesforceConn.sobject('Opportunity').update({
      Id: context.opportunityId,
      StageName: context.updates.stage,
      Probability: context.updates.probability,
      Description: context.updates.notes,
      NextStep: context.updates.nextSteps
    });
    
    // Also log activity
    await salesforceConn.sobject('Task').create({
      WhatId: context.opportunityId,
      Subject: 'AI Sales Call',
      Description: `Pain Points: ${context.updates.painPoints?.join(', ')}`,
      Status: 'Completed',
      ActivityDate: new Date().toISOString()
    });
    
    return { success: true };
  }
});
```

### Calendar Tool

```typescript
// src/mastra/tools/calendar-tool.ts
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { google } from 'googleapis';

const calendar = google.calendar('v3');

export const scheduleMeetingTool = createTool({
  id: 'schedule-meeting',
  description: 'Schedule a follow-up meeting',
  
  inputSchema: z.object({
    customerEmail: z.string().email(),
    preferredTimes: z.array(z.string()),
    meetingType: z.enum(['demo', 'follow-up', 'closing'])
  }),
  
  execute: async ({ context }) => {
    // Find available slot
    const availableSlot = await findAvailableSlot(context.preferredTimes);
    
    // Create calendar event
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `${context.meetingType} - AI Sales Agent`,
        description: 'Follow-up from AI sales conversation',
        start: {
          dateTime: availableSlot.start,
          timeZone: 'America/New_York'
        },
        end: {
          dateTime: availableSlot.end,
          timeZone: 'America/New_York'
        },
        attendees: [
          { email: context.customerEmail }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      }
    });
    
    return {
      success: true,
      meetingLink: event.data.htmlLink,
      scheduledTime: availableSlot.start
    };
  }
});
```

---

## Part 7: Deployment & Scaling

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --production

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.js"]
```

### Docker Compose (Full Stack)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Main application
  sales-agent:
    build: .
    ports:
      - "3000:3000"
    environment:
      - SMALLEST_API_KEY=${SMALLEST_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - PINECONE_API_KEY=${PINECONE_API_KEY}
      - SALESFORCE_USERNAME=${SALESFORCE_USERNAME}
      - SALESFORCE_PASSWORD=${SALESFORCE_PASSWORD}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
  
  # PostgreSQL for CRM data and Mastra storage
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=sales_agent
      - POSTGRES_USER=agent
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
  
  # Redis for session state
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
  
  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - sales-agent
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Scaling with Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sales-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sales-agent
  template:
    metadata:
      labels:
        app: sales-agent
    spec:
      containers:
      - name: sales-agent
        image: sales-agent:latest
        ports:
        - containerPort: 3000
        env:
        - name: SMALLEST_API_KEY
          valueFrom:
            secretKeyRef:
              name: sales-agent-secrets
              key: smallest-api-key
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: sales-agent-secrets
              key: anthropic-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

---

## Part 8: Performance Optimization

### Latency Budget

```
Target Total Latency: < 1500ms

Breakdown:
┌─────────────────────────────────────────────┐
│ Customer stops speaking                     │ 0ms
├─────────────────────────────────────────────┤
│ Smallest.ai VAD detection                   │ +100ms
├─────────────────────────────────────────────┤
│ Smallest.ai STT (Electron model)            │ +150ms
├─────────────────────────────────────────────┤
│ Mastra intent classification                │ +50ms
├─────────────────────────────────────────────┤
│ Mastra agent reasoning (parallel)           │ +400ms
├─────────────────────────────────────────────┤
│ Mastra response generation (streaming)      │ +500ms
├─────────────────────────────────────────────┤
│ Smallest.ai TTS (WAVES/Lightning)           │ +100ms
├─────────────────────────────────────────────┤
│ Network transmission                        │ +100ms
├─────────────────────────────────────────────┤
│ Audio playback begins                       │ 1400ms ✓
└─────────────────────────────────────────────┘
```

### Optimization Strategies

```typescript
// 1. Parallel processing
async function processCustomerInput(text: string) {
  // Run all analyses in parallel
  const [intent, sentiment, entities, buyingSignals, knowledge] = 
    await Promise.all([
      classifyIntent(text),
      analyzeSentiment(text),
      extractEntities(text),
      detectBuyingSignals(text),
      retrieveKnowledge(text)
    ]);
  
  return { intent, sentiment, entities, buyingSignals, knowledge };
}

// 2. Streaming responses
const agent = mastra.getAgent('salesDirector');
const stream = await agent.generateStream({
  messages: [{ role: 'user', content: text }],
  threadId
});

// Start TTS as soon as we have a complete sentence
let buffer = '';
for await (const chunk of stream) {
  buffer += chunk.text;
  
  if (isCompleteSentence(buffer)) {
    // Stream to TTS immediately
    voicePipeline.synthesize(sessionId, buffer);
    buffer = '';
  }
}

// 3. Predictive pre-warming
class PredictiveEngine {
  async prewarmLikelyResponses(context: ConversationContext) {
    const likelyQuestions = this.predictNext(context);
    
    // Pre-fetch knowledge for likely questions
    await Promise.all(
      likelyQuestions.map(q => 
        knowledgeBase.prefetch(q)
      )
    );
  }
}

// 4. Caching strategy
const responseCache = new Map<string, string>();

function getCachedResponse(intent: string, context: any): string | null {
  const key = `${intent}-${context.dealStage}-${context.industry}`;
  return responseCache.get(key);
}
```

---

## Part 9: Monitoring & Analytics

### Mastra Built-in Observability

```typescript
// Mastra provides automatic tracing and logging

// Enable detailed telemetry
export const mastra = new Mastra({
  telemetry: {
    serviceName: 'sales-agent',
    exporters: ['console', 'datadog', 'prometheus'],
    sampleRate: 1.0, // 100% sampling in production
    
    // Custom attributes
    attributes: {
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    }
  },
  
  logger: {
    level: 'debug',
    destination: './logs/mastra.log',
    
    // Structured logging
    formatter: 'json',
    
    // Custom fields
    fields: {
      service: 'sales-agent',
      datacenter: 'us-west-2'
    }
  }
});

// Traces are automatically created for:
// - Agent calls
// - Tool executions
// - Workflow steps
// - Memory operations

// Access traces programmatically
const traces = await mastra.telemetry.getTraces({
  operation: 'agent.generate',
  startTime: Date.now() - 3600000, // Last hour
  filter: {
    'agent.id': 'sales-director',
    'conversation.outcome': 'closed_won'
  }
});
```

### Custom Analytics Dashboard

```typescript
// src/analytics/call-analytics.ts
export class CallAnalytics {
  async trackCall(sessionId: string, metrics: {
    duration: number;
    customerTalkTime: number;
    agentTalkTime: number;
    questionsAsked: number;
    objectionsRaised: number;
    buyingSignalsDetected: number;
    outcome: string;
  }) {
    
    await db.callMetrics.create({
      data: {
        sessionId,
        ...metrics,
        talkRatio: metrics.customerTalkTime / 
          (metrics.customerTalkTime + metrics.agentTalkTime),
        timestamp: new Date()
      }
    });
    
    // Real-time dashboard update
    await this.updateDashboard({
      sessionsToday: await this.getSessionCount('today'),
      avgDuration: await this.getAvgDuration('today'),
      conversionRate: await this.getConversionRate('today'),
      topObjections: await this.getTopObjections('week')
    });
  }
  
  async generateReport(timeframe: 'day' | 'week' | 'month') {
    const calls = await db.callMetrics.findMany({
      where: {
        timestamp: {
          gte: this.getStartDate(timeframe)
        }
      }
    });
    
    return {
      totalCalls: calls.length,
      avgDuration: this.average(calls.map(c => c.duration)),
      avgTalkRatio: this.average(calls.map(c => c.talkRatio)),
      conversionRate: this.calculateConversion(calls),
      outcomeBreakdown: this.groupBy(calls, 'outcome'),
      topPerformingAgents: await this.getTopPerformingAgents(calls)
    };
  }
}
```

---

## Part 10: Testing & Evaluation

### Mastra Evaluation System

```typescript
// src/evals/conversation-evals.ts
import { createEval } from '@mastra/core/evals';

export const discoveryQualityEval = createEval({
  id: 'discovery-quality',
  description: 'Evaluate quality of discovery conversation',
  
  scorer: async ({ input, output, expectedOutput }) => {
    // Check if key questions were asked
    const requiredQuestions = [
      'current process',
      'pain points',
      'team size',
      'budget',
      'timeline'
    ];
    
    const askedQuestions = requiredQuestions.filter(q =>
      output.conversation.includes(q)
    );
    
    return {
      score: askedQuestions.length / requiredQuestions.length,
      details: {
        askedQuestions,
        missedQuestions: requiredQuestions.filter(q =>
          !askedQuestions.includes(q)
        )
      }
    };
  }
});

export const objectionHandlingEval = createEval({
  id: 'objection-handling',
  description: 'Evaluate objection handling effectiveness',
  
  scorer: async ({ input, output }) => {
    const framework = [
      'acknowledged',
      'clarified',
      'isolated',
      'addressed',
      'confirmed'
    ];
    
    const steps = framework.filter(step =>
      this.detectStep(step, output.response)
    );
    
    return {
      score: steps.length / framework.length,
      details: {
        completedSteps: steps,
        frameworkCoverage: `${steps.length}/${framework.length}`
      }
    };
  }
});

// Run evals
const results = await mastra.runEval({
  eval: discoveryQualityEval,
  dataset: testConversations,
  batchSize: 10
});

console.log(`Average discovery quality: ${results.avgScore}`);
```

---

## Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Mastra.ai project
- [ ] Configure Smallest.ai account and API
- [ ] Build basic WebSocket server
- [ ] Create Sales Director agent
- [ ] Implement voice pipeline integration
- [ ] Test end-to-end conversation flow

### Phase 2: Core Agents (Week 3-4)
- [ ] Build Product Expert agent
- [ ] Build Objection Handler agent
- [ ] Build Qualifier agent
- [ ] Build Closing agent
- [ ] Implement agent routing logic
- [ ] Add CRM integration (Salesforce)

### Phase 3: Workflows (Week 5-6)
- [ ] Create Discovery workflow
- [ ] Create Demo workflow
- [ ] Create Objection Handling workflow
- [ ] Create Closing workflow
- [ ] Add workflow branching logic

### Phase 4: Knowledge & Memory (Week 7-8)
- [ ] Set up Pinecone vector database
- [ ] Populate product knowledge base
- [ ] Add case studies
- [ ] Configure Mastra memory
- [ ] Implement semantic search

### Phase 5: Production Readiness (Week 9-10)
- [ ] Add comprehensive error handling
- [ ] Implement monitoring and logging
- [ ] Set up analytics dashboard
- [ ] Create evaluation suite
- [ ] Performance optimization
- [ ] Security hardening

### Phase 6: Testing & Launch (Week 11-12)
- [ ] Run simulated conversations
- [ ] Conduct A/B tests
- [ ] Gather feedback
- [ ] Refine prompts and workflows
- [ ] Pilot with real customers
- [ ] Production launch

---

## Conclusion

This architecture combines the best of both worlds:

**Mastra.ai** provides:
- Robust agent orchestration
- Sophisticated workflow management
- Built-in memory and context
- Production-ready tooling
- Observability and monitoring

**Smallest.ai** provides:
- Ultra-low latency voice (100ms TTS)
- Natural, human-like speech
- Real-time conversation handling
- Multi-language support
- Cost-effective scaling ($0.01/min)

Together, they create a production-ready AI sales agent that can:
- Conduct natural, human-like sales conversations
- Handle complex objections strategically
- Qualify leads effectively
- Close deals autonomously
- Scale to thousands of concurrent calls
- Maintain sub-1.5-second response times

The system is modular, observable, and ready for enterprise deployment.
