/**
 * Fixture responses that simulate what Gemini Flash returns
 * when classifying transcript intents. These are used by tests
 * to mock the Gemini client without making real API calls.
 */

export const GEMINI_DATA_CLAIM_RESPONSE = {
  intents: [
    {
      type: 'DATA_CLAIM' as const,
      confidence: 0.95,
      excerpt: 'revenue grew 40% last quarter',
    },
  ],
};

export const GEMINI_MULTI_INTENT_RESPONSE = {
  intents: [
    {
      type: 'DATA_CLAIM' as const,
      confidence: 0.92,
      excerpt: 'revenue grew 40%',
    },
    {
      type: 'REFERENCE' as const,
      confidence: 0.88,
      excerpt: 'McKinsey also noted in their recent AI report',
    },
    {
      type: 'EMAIL_MENTION' as const,
      confidence: 0.85,
      excerpt: 'Sarah emailed me the details last week',
    },
  ],
};

export const GEMINI_KEY_POINT_DECISION_RESPONSE = {
  intents: [
    {
      type: 'KEY_POINT' as const,
      confidence: 0.9,
      excerpt: 'The critical takeaway is that we need to pivot',
    },
    {
      type: 'DECISION' as const,
      confidence: 0.87,
      excerpt: "We've decided to go with vendor B",
    },
    {
      type: 'ACTION_ITEM' as const,
      confidence: 0.91,
      excerpt: 'Sarah needs to send the revised budget by Friday',
    },
  ],
};

export const GEMINI_TOPIC_SHIFT_RESPONSE = {
  intents: [
    {
      type: 'TOPIC_SHIFT' as const,
      confidence: 0.8,
      excerpt: 'Moving on to our hiring strategy',
    },
  ],
};

export const GEMINI_NO_INTENT_RESPONSE = {
  intents: [],
};

export const GEMINI_QUESTION_RESPONSE = {
  intents: [
    {
      type: 'QUESTION' as const,
      confidence: 0.88,
      excerpt: 'How do we plan to address the talent gap?',
    },
  ],
};

export const GEMINI_DOC_MENTION_RESPONSE = {
  intents: [
    {
      type: 'DOC_MENTION' as const,
      confidence: 0.86,
      excerpt: 'If you look at the Q3 budget spreadsheet',
    },
  ],
};

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
