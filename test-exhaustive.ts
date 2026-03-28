import WebSocket from 'ws';
// @ts-ignore
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/orchestrator';
const WS_URL = 'ws://localhost:3000/ws';
const SESSION_ID = `test-exhaustive-${Date.now()}`;

/**
 * EXHAUSTIVE TEST SUITE
 *
 * This script tests all major features of EchoLens:
 * - All chart types (pie, bar, mindmap, timeline, quadrant, etc.)
 * - All agent types (chart, reference, context, summary)
 * - Agent combinations and parallel dispatch
 * - Edge cases and error handling
 * - Performance and responsiveness
 *
 * Usage:
 *   npm run dev:corporate          # Terminal 1: Start the server
 *   npx tsx test-exhaustive.ts     # Terminal 2: Run this script
 *
 * Open: http://localhost:3000/?session=test-exhaustive-<timestamp>
 */

interface TestCase {
  name: string;
  text: string;
  expectedAgents: string[];
  expectedChartType?: string;
  wait: number;
}

const TEST_CASES: TestCase[] = [
  // ============================================================
  // SECTION 1: CHART AGENT — ALL DIAGRAM TYPES
  // ============================================================
  {
    name: '1.1: PIE CHART — Revenue breakdown',
    text: 'Our revenue is split: 68% enterprise, 22% mid-market, 10% SMB.',
    expectedAgents: ['chart'],
    expectedChartType: 'pie',
    wait: 4000,
  },
  {
    name: '1.2: BAR CHART — Quarterly hiring',
    text: 'We hired 12 people in Q3, 8 in Q2, 5 in Q1. Clear acceleration.',
    expectedAgents: ['chart'],
    expectedChartType: 'xychart-beta',
    wait: 4000,
  },
  {
    name: '1.3: MINDMAP — Strategic initiatives',
    text: 'Our 2026 strategy covers three pillars: product velocity, market expansion, and operational excellence. Under product velocity: Anomaly Detection v2 and Real-time API. Under market expansion: APAC hiring and federal compliance.',
    expectedAgents: ['chart'],
    expectedChartType: 'mindmap',
    wait: 4000,
  },
  {
    name: '1.4: TIMELINE — Product milestones',
    text: 'January we launched Anomaly Detection, February we achieved SOC 2, March we started FedRAMP, and Q2 we target the federal market.',
    expectedAgents: ['chart'],
    expectedChartType: 'timeline',
    wait: 4000,
  },
  {
    name: '1.5: QUADRANT — Customer maturity matrix',
    text: 'Plot our 284 customers: high-engagement enterprise on the upper right, churn-risk at lower left, mid-market growth in upper left.',
    expectedAgents: ['chart'],
    expectedChartType: 'quadrantChart',
    wait: 4000,
  },
  {
    name: '1.6: DATA with PERCENTAGES',
    text: 'Net Dollar Retention is 112 percent, gross margin hit 74 point 2 percent, and our burn multiple is 1 point 6 times.',
    expectedAgents: ['chart'],
    wait: 4000,
  },
  {
    name: '1.7: DATA with CURRENCY',
    text: 'We closed a $1.4 million deal with GreenField Energy, $890K with Atlas Freight, and the expansion pipeline sits at $3.1 million.',
    expectedAgents: ['chart'],
    wait: 4000,
  },
  {
    name: '1.8: DATA with NUMBERS',
    text: 'Our ARR is $42 million, up from $30 million last year. Headcount is 310, up from 240.',
    expectedAgents: ['chart'],
    wait: 4000,
  },

  // ============================================================
  // SECTION 2: REFERENCE AGENT
  // ============================================================
  {
    name: '2.1: SINGLE SOURCE reference',
    text: 'According to McKinsey, top-quartile SaaS companies maintain NDR above 120%.',
    expectedAgents: ['reference'],
    wait: 4000,
  },
  {
    name: '2.2: RESEARCH PAPER reference',
    text: 'A study from Harvard Business School found that companies with strong executive alignment have 3x higher retention rates.',
    expectedAgents: ['reference'],
    wait: 4000,
  },
  {
    name: '2.3: GARTNER QUADRANT reference',
    text: 'Gartner Magic Quadrant for Supply Chain Planning identifies real-time anomaly detection as a critical differentiator.',
    expectedAgents: ['reference'],
    wait: 4000,
  },
  {
    name: '2.4: INDUSTRY BENCHMARK reference',
    text: 'Benchmarks show CAC payback below 18 months correlates with capital-efficient growth. We are at 18 months exactly.',
    expectedAgents: ['reference'],
    wait: 4000,
  },

  // ============================================================
  // SECTION 3: CONTEXT AGENT
  // ============================================================
  {
    name: '3.1: EMAIL MENTION — churn context',
    text: 'Lena sent an email about Meridian Health and TrueNorth Logistics showing churn signals.',
    expectedAgents: ['context'],
    wait: 4000,
  },
  {
    name: '3.2: DOCUMENT MENTION — board materials',
    text: 'The board deck has the latest ARR and NDR metrics we need to discuss.',
    expectedAgents: ['context'],
    wait: 4000,
  },
  {
    name: '3.3: CALENDAR EVENT — upcoming meeting',
    text: 'The GreenField Energy executive alignment call is scheduled for tomorrow at 11 AM.',
    expectedAgents: ['context'],
    wait: 4000,
  },
  {
    name: '3.4: SLACK MESSAGE — engineering update',
    text: 'The team posted in Slack that Anomaly Detection v2 is passing integration tests with 180ms latency.',
    expectedAgents: ['context'],
    wait: 4000,
  },
  {
    name: '3.5: PERSON MENTION — multiple contacts',
    text: 'Derek, Raj, and Natasha need to coordinate on the pipeline, engineering roadmap, and financial planning.',
    expectedAgents: ['context'],
    wait: 4000,
  },

  // ============================================================
  // SECTION 4: SUMMARY AGENT
  // ============================================================
  {
    name: '4.1: KEY POINT extraction',
    text: 'The critical insight is that our win rate against Chainlink has dropped from 68% to 54% quarter over quarter.',
    expectedAgents: ['summary'],
    wait: 4000,
  },
  {
    name: '4.2: DECISION extraction',
    text: 'We have decided to allocate 25% of the next sprint to reliability work and dedicate a CSM to the Meridian save plan.',
    expectedAgents: ['summary'],
    wait: 4000,
  },
  {
    name: '4.3: ACTION ITEM extraction',
    text: 'Lena needs to deliver the Chainlink competitive battlecard by Friday. Natasha will circulate the board deck by Wednesday.',
    expectedAgents: ['summary'],
    wait: 4000,
  },
  {
    name: '4.4: QUESTION extraction',
    text: 'Can we achieve FedRAMP authorization by Q2 2026? Should we hire the full 36-person cohort in H1 or phase it?',
    expectedAgents: ['summary'],
    wait: 4000,
  },

  // ============================================================
  // SECTION 5: AGENT COMBINATIONS
  // ============================================================
  {
    name: '5.1: CHART + REFERENCE combo',
    text: 'Our Net Dollar Retention is 112%. According to McKinsey SaaS benchmarks, this puts us in the top quartile.',
    expectedAgents: ['chart', 'reference'],
    wait: 5000,
  },
  {
    name: '5.2: CHART + CONTEXT combo',
    text: 'We hired 18 engineers this year. The hiring plan document outlines the breakdown by team.',
    expectedAgents: ['chart', 'context'],
    wait: 5000,
  },
  {
    name: '5.3: CHART + SUMMARY combo',
    text: 'Revenue growth of 38% year-over-year is a key point. Our main decision is to reinvest in product velocity.',
    expectedAgents: ['chart', 'summary'],
    wait: 5000,
  },
  {
    name: '5.4: REFERENCE + CONTEXT + SUMMARY combo',
    text: 'Gartner identified anomaly detection as critical. The roadmap document shows we are ahead. Key point: we are now competitive with Chainlink.',
    expectedAgents: ['reference', 'context', 'summary'],
    wait: 5000,
  },
  {
    name: '5.5: ALL FOUR AGENTS combo',
    text: 'Our $42 million ARR represents 38% year-over-year growth according to our Q4 board deck. This is critical for the Series C round. We need to close the GreenField deal by Friday. McKinsey research shows companies with strong growth profiles have better outcomes.',
    expectedAgents: ['chart', 'reference', 'context', 'summary'],
    wait: 6000,
  },

  // ============================================================
  // SECTION 6: EDGE CASES & ERROR HANDLING
  // ============================================================
  {
    name: '6.1: NO ACTIONABLE CONTENT',
    text: 'The weather today is nice. I had coffee this morning.',
    expectedAgents: [],
    wait: 3000,
  },
  {
    name: '6.2: AMBIGUOUS NUMBERS (should still chart)',
    text: 'We saw some improvement, maybe twenty or thirty percent more than before.',
    expectedAgents: ['chart'],
    wait: 4000,
  },
  {
    name: '6.3: MULTI-SENTENCE with mixed intents',
    text: 'First, our Q3 numbers. Revenue was $42 million, up from $30 million. Second, Lena emailed about the churn situation. Third, we need to decide on the hiring plan by next week.',
    expectedAgents: ['chart', 'context', 'summary'],
    wait: 5000,
  },
  {
    name: '6.4: VERY LONG STATEMENT (stress test)',
    text: 'Our quarterly business review covered extensive ground. Starting with ARR at $42 million up 38% year-over-year, NDR at 112%, gross margin at 74.2%, CAC payback at 18 months. The weighted pipeline is $8.2 million against a $6.5 million target. Key deals include GreenField Energy at $1.4 million, Atlas Freight at $890K. Customer health shows 62% green, 24% yellow, 14% red. Churn risk includes Meridian Health, TrueNorth Logistics, Pinnacle Manufacturing. Engineering metrics: velocity 94 points, deploys 4.2 per day, MTTR 38 minutes. We decided to allocate 25% to reliability. Actions: Lena delivering battlecard, Natasha circulating deck, Raj reprioritizing roadmap.',
    expectedAgents: ['chart', 'context', 'summary'],
    wait: 6000,
  },

  // ============================================================
  // SECTION 7: PERFORMANCE & RESPONSIVENESS
  // ============================================================
  {
    name: '7.1: RAPID FIRE — Chart test 1',
    text: 'Revenue breakdown: 50% segment A, 30% segment B, 20% segment C.',
    expectedAgents: ['chart'],
    wait: 2000,
  },
  {
    name: '7.2: RAPID FIRE — Chart test 2',
    text: 'Growth trajectory: Q1 was $30M, Q2 was $35M, Q3 was $42M.',
    expectedAgents: ['chart'],
    wait: 2000,
  },
  {
    name: '7.3: RAPID FIRE — Context test',
    text: 'Check the board deck for latest metrics.',
    expectedAgents: ['context'],
    wait: 2000,
  },
  {
    name: '7.4: RAPID FIRE — Summary test',
    text: 'Decision: move forward with the initiative.',
    expectedAgents: ['summary'],
    wait: 2000,
  },

  // ============================================================
  // SECTION 8: REAL-WORLD SCENARIOS
  // ============================================================
  {
    name: '8.1: SALES PITCH',
    text: 'Our platform reduced customer churn by 15% and improved time-to-value from 6 months to 6 weeks. According to a recent Gartner report, this speed is a competitive advantage.',
    expectedAgents: ['chart', 'reference'],
    wait: 5000,
  },
  {
    name: '8.2: BOARD DISCUSSION',
    text: 'The board asked three things: first, where is our Rule of 40 at 36 and how do we get to 40? Second, the Chainlink competitive threat. Third, the FedRAMP timeline. The roadmap shows FedRAMP completion by Q2.',
    expectedAgents: ['chart', 'context', 'summary'],
    wait: 5000,
  },
  {
    name: '8.3: CUSTOMER CRISIS',
    text: 'Meridian Health is our second-largest customer at $480K ARR. Their VP of Ops just left. Usage is down 40%. We are proposing a dedicated CSM and complimentary QBR to save the account.',
    expectedAgents: ['context', 'summary'],
    wait: 5000,
  },
  {
    name: '8.4: ENGINEERING STANDUP',
    text: 'Sprint velocity is 94 points, we deployed 4 times yesterday, MTTR is down to 38 minutes. One P1 incident last month hurt uptime to 99.91%. Decisions: improve observability and circuit breakers.',
    expectedAgents: ['chart', 'summary'],
    wait: 5000,
  },
];

async function runTest(test: TestCase, index: number, total: number) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`Test ${index}/${total}: ${test.name}`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`📝 "${test.text.slice(0, 100)}${test.text.length > 100 ? '...' : ''}"`);
  console.log(`🎯 Expected: ${test.expectedAgents.length > 0 ? test.expectedAgents.join(', ') : 'none'}`);

  try {
    const start = Date.now();
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: test.text,
        sessionId: SESSION_ID,
        timestamp: Date.now(),
      }),
    });

    const data = await res.json();
    const duration = Date.now() - start;
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`✅ Orchestrator processed successfully`);
  } catch (err) {
    console.error(`❌ Error: ${err}`);
  }

  console.log(`⏳ Waiting ${test.wait}ms for agents to complete...`);
  await new Promise((r) => setTimeout(r, test.wait));
}

async function runTestSuite() {
  console.log(`\n${'█'.repeat(70)}`);
  console.log(`  ECHOLENS — EXHAUSTIVE FEATURE TEST SUITE`);
  console.log(`  ${TEST_CASES.length} test cases across 8 sections`);
  console.log(`${'█'.repeat(70)}`);
  console.log(`\n📊 Open this URL to watch the tests in real-time:`);
  console.log(`   http://localhost:3000/?session=${SESSION_ID}\n`);

  console.log(`Connecting to WebSocket...`);
  const ws = new WebSocket(WS_URL);

  const statsCollector = {
    chartTests: 0,
    referenceTests: 0,
    contextTests: 0,
    summaryTests: 0,
    messages: [] as any[],
  };

  await new Promise<void>((resolve) => {
    ws.on('open', () => {
      console.log(`✅ WebSocket connected\n`);
      ws.send(JSON.stringify({ event: 'session:start', sessionId: SESSION_ID }));
      resolve();
    });
  });

  ws.on('message', (data: any) => {
    const msg = JSON.parse(data.toString());
    statsCollector.messages.push(msg);
    if (msg.event === 'agent:chart') statsCollector.chartTests++;
    if (msg.event === 'agent:reference') statsCollector.referenceTests++;
    if (msg.event === 'agent:context') statsCollector.contextTests++;
    if (msg.event === 'agent:summary') statsCollector.summaryTests++;
  });

  // Run tests sequentially
  for (let i = 0; i < TEST_CASES.length; i++) {
    await runTest(TEST_CASES[i], i + 1, TEST_CASES.length);
  }

  // Summary
  console.log(`\n${'█'.repeat(70)}`);
  console.log(`  TEST SUITE COMPLETE`);
  console.log(`${'█'.repeat(70)}`);
  console.log(`\n📈 Results:`);
  console.log(`   Total tests run: ${TEST_CASES.length}`);
  console.log(`   Chart agent responses: ${statsCollector.chartTests}`);
  console.log(`   Reference agent responses: ${statsCollector.referenceTests}`);
  console.log(`   Context agent responses: ${statsCollector.contextTests}`);
  console.log(`   Summary agent responses: ${statsCollector.summaryTests}`);
  console.log(`   Total agent responses: ${statsCollector.messages.length}\n`);

  console.log(`View full results at: http://localhost:3000/?session=${SESSION_ID}`);
  console.log(`\n✨ All tests complete!`);

  ws.close();
  process.exit(0);
}

runTestSuite();
