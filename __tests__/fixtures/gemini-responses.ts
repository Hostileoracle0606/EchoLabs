/**
 * Fixture responses that simulate Gemini's function-calling responses.
 * Used by tests to mock the Gemini SDK without making real API calls.
 */

// ---------------------------------------------------------------------------
// Function-calling response fixtures (new architecture)
// ---------------------------------------------------------------------------

/** Helper to build a mock Gemini generateContent response with functionCall parts */
export function buildFunctionCallResponse(
  ...calls: Array<{ name: string; args: Record<string, unknown> }>
) {
  return {
    candidates: [
      {
        content: {
          parts: calls.map((call) => ({
            functionCall: { name: call.name, args: call.args },
          })),
        },
      },
    ],
  };
}

/** Helper to build a text-only response (no function calls) */
export function buildTextResponse(text: string) {
  return {
    candidates: [
      {
        content: {
          parts: [{ text }],
        },
      },
    ],
  };
}

/** Single chart skill invocation */
export const FC_DATA_CLAIM_RESPONSE = buildFunctionCallResponse({
  name: 'generate_chart',
  args: { claim: 'revenue grew 40% last quarter' },
});

/** Multiple parallel skill invocations */
export const FC_MULTI_SKILL_RESPONSE = buildFunctionCallResponse(
  { name: 'generate_chart', args: { claim: 'revenue grew 40%' } },
  { name: 'find_references', args: { query: 'McKinsey AI report', source_hint: 'McKinsey' } },
  { name: 'search_context', args: { search_text: 'Sarah emailed me the details' } }
);

/** Summary + action item skill invocation */
export const FC_SUMMARY_RESPONSE = buildFunctionCallResponse({
  name: 'extract_summary',
  args: {
    text: 'The critical takeaway is we need to pivot. Sarah needs to send the revised budget by Friday.',
    categories: ['key_point', 'action_item'],
  },
});

/** No function calls — Gemini returns text only */
export const FC_NO_SKILLS_RESPONSE = buildTextResponse('No actionable content detected.');

/** Context search skill invocation */
export const FC_CONTEXT_RESPONSE = buildFunctionCallResponse({
  name: 'search_context',
  args: { search_text: 'Q3 budget spreadsheet' },
});

// ---------------------------------------------------------------------------
// Legacy fixtures (kept for agent service tests that still use them)
// ---------------------------------------------------------------------------

export const GEMINI_CHART_MERMAID_RESPONSE = {
  mermaid: 'pie title Revenue Breakdown\n  "Enterprise" : 40\n  "SMB" : 35\n  "Consumer" : 25',
  narration: 'Revenue is split across three segments, with enterprise leading at 40 percent',
  diagramType: 'pie',
};

export const GEMINI_CHART_BAR_RESPONSE = {
  mermaid: 'xychart-beta\n  title "Hiring by Quarter"\n  x-axis [Q1, Q2, Q3]\n  bar [5, 8, 12]',
  narration: 'Hiring has accelerated each quarter, reaching 12 in Q3',
  diagramType: 'xychart-beta',
};

export const GEMINI_CHART_MINDMAP_RESPONSE = {
  mermaid: 'mindmap\n  root((AI Strategy))\n    Hiring\n      5 ML Engineers\n    Infrastructure\n      GPU Cluster',
  narration: 'The AI strategy encompasses hiring and infrastructure investments',
  diagramType: 'mindmap',
};

export const GEMINI_REFERENCE_RESPONSE = {
  title: 'The State of AI in 2025 — McKinsey Global Institute',
  url: 'https://mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai',
  snippet: 'AI adoption has doubled since 2023, with 72% of organizations now using AI in at least one business function.',
  confidence: 'verified' as const,
  domain: 'mckinsey.com',
};

export const GEMINI_SUMMARY_SWEEP_RESPONSE = [
  {
    category: 'key_point' as const,
    text: 'Revenue grew 40% last quarter, driven by enterprise',
  },
  {
    category: 'decision' as const,
    text: 'Will hire 5 more engineers in Q1',
  },
  {
    category: 'action_item' as const,
    text: 'Sarah to send revised budget by Friday',
    owner: 'Sarah',
  },
  {
    category: 'question' as const,
    text: 'Should we expand into APAC this year?',
  },
];

// ---------------------------------------------------------------------------
// Corporate QBR fixtures (NovaBridge Technologies scenario)
// ---------------------------------------------------------------------------

/** ARR growth pie chart */
export const CORPORATE_CHART_ARR_RESPONSE = {
  mermaid: 'pie title "ARR Composition by Segment"\n  "Enterprise (>$100K)" : 68\n  "Mid-Market ($25K-$100K)" : 22\n  "SMB (<$25K)" : 10',
  narration: 'Enterprise contracts above $100K make up 68% of the $42M ARR, with mid-market at 22%',
  diagramType: 'pie',
  title: 'ARR Composition by Segment',
};

/** Unit economics bar chart */
export const CORPORATE_CHART_METRICS_RESPONSE = {
  mermaid: 'xychart-beta\n  title "Key SaaS Metrics"\n  x-axis ["NDR %", "Gross Margin %", "Rule of 40"]\n  bar [112, 74.2, 36]',
  narration: 'NDR at 112% and gross margin at 74.2% are strong, but Rule of 40 at 36 is slightly below the 40 benchmark',
  diagramType: 'xychart-beta',
  title: 'Key SaaS Metrics',
};

/** Pipeline waterfall chart */
export const CORPORATE_CHART_PIPELINE_RESPONSE = {
  mermaid: 'xychart-beta\n  title "Q4 Weighted Pipeline ($M)"\n  x-axis ["GreenField Energy", "Atlas Freight", "Cobalt Systems", "Other Deals"]\n  bar [1.05, 0.53, 0.36, 6.26]',
  narration: 'Weighted pipeline of $8.2M is well above the $6.5M target, led by GreenField Energy at $1.4M (75% probability)',
  diagramType: 'xychart-beta',
  title: 'Q4 Weighted Pipeline',
};

/** Headcount plan chart */
export const CORPORATE_CHART_HEADCOUNT_RESPONSE = {
  mermaid: 'pie title "H1 2026 Hiring Plan (36 Hires)"\n  "Engineering" : 18\n  "Sales" : 12\n  "Customer Success" : 6',
  narration: 'Engineering receives half of the 36 planned hires, with sales at 12 and customer success at 6',
  diagramType: 'pie',
  title: 'H1 2026 Hiring Plan',
};

/** Engineering metrics chart */
export const CORPORATE_CHART_ENGINEERING_RESPONSE = {
  mermaid: 'xychart-beta\n  title "Engineering Health"\n  x-axis ["Velocity (pts)", "Deploys/day", "MTTR (min)", "Change Fail %"]\n  bar [94, 4.2, 38, 3.1]',
  narration: 'Engineering metrics are strong: velocity above target, 4.2 deploys per day, MTTR down to 38 minutes',
  diagramType: 'xychart-beta',
  title: 'Engineering Health Metrics',
};

/** Customer health distribution */
export const CORPORATE_CHART_HEALTH_RESPONSE = {
  mermaid: 'pie title "Customer Health Distribution (284 Logos)"\n  "Green (Healthy)" : 62\n  "Yellow (Watch)" : 24\n  "Red (At Risk)" : 14',
  narration: '62% of customers are healthy, but 14% are in the red zone representing $2.1M of at-risk ARR',
  diagramType: 'pie',
  title: 'Customer Health Distribution',
};

/** Financial scenarios chart */
export const CORPORATE_CHART_SCENARIOS_RESPONSE = {
  mermaid: 'xychart-beta\n  title "2026 ARR Scenarios ($M)"\n  x-axis ["Downside", "Base Case", "Upside"]\n  bar [50, 58, 65]',
  narration: 'Base case projects $58M ARR with 38% growth, while upside could reach $65M if expansion pipeline fully converts',
  diagramType: 'xychart-beta',
  title: '2026 ARR Scenarios',
};

/** Corporate reference: Gartner supply chain */
export const CORPORATE_REFERENCE_GARTNER = {
  title: 'Gartner Magic Quadrant for Supply Chain Planning Solutions, 2025',
  url: 'https://gartner.com/en/documents/supply-chain-planning-mq-2025',
  snippet: 'Real-time anomaly detection and AI-driven demand sensing have become critical differentiators. Leaders in the quadrant demonstrate sub-200ms detection latency and automated remediation workflows.',
  confidence: 'verified' as const,
  domain: 'gartner.com',
};

/** Corporate reference: McKinsey NDR benchmarks */
export const CORPORATE_REFERENCE_MCKINSEY = {
  title: 'SaaS Benchmarks: The Metrics That Matter — McKinsey & Company',
  url: 'https://mckinsey.com/industries/technology/our-insights/saas-benchmarks',
  snippet: 'Top-quartile B2B SaaS companies maintain Net Dollar Retention above 120% and achieve Rule of 40 scores of 45+. CAC payback below 18 months correlates with capital-efficient growth.',
  confidence: 'verified' as const,
  domain: 'mckinsey.com',
};

/** Corporate summary bullets */
export const CORPORATE_SUMMARY_QBR = [
  {
    category: 'key_point' as const,
    text: 'ARR reached $42M, up 38% YoY with 22 net new logos',
  },
  {
    category: 'key_point' as const,
    text: 'Win rate vs Chainlink AI dropped from 68% to 54%',
  },
  {
    category: 'decision' as const,
    text: 'Allocate 25% of next sprint to reliability work',
  },
  {
    category: 'decision' as const,
    text: 'Dedicate CSM to Meridian Health for 90-day save plan',
  },
  {
    category: 'action_item' as const,
    text: 'Lena to deliver Chainlink competitive battlecard by Friday',
    owner: 'Lena Vasquez',
  },
  {
    category: 'action_item' as const,
    text: 'Natasha to circulate final board deck by Wednesday',
    owner: 'Natasha Kim',
  },
  {
    category: 'action_item' as const,
    text: 'Raj to reprioritize roadmap for reliability investment',
    owner: 'Raj Subramanian',
  },
  {
    category: 'question' as const,
    text: 'Can we achieve FedRAMP authorization by Q2 2026?',
  },
];
