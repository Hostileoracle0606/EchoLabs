# EchoLens Exhaustive Test Suite

This guide explains how to use the **exhaustive test suite** to thoroughly test all features of EchoLens.

## Quick Start

### Terminal 1: Start the Server
```bash
npm run dev:corporate
```
This starts the Next.js dev server + WebSocket server with the corporate dataset.

### Terminal 2: Run the Tests
```bash
npm run test:exhaustive
```

### Browser: Watch Real-Time Results
Open the URL printed by the test script:
```
http://localhost:3000/?session=test-exhaustive-<TIMESTAMP>
```

You'll see all test cases play out in real-time:
- Charts being generated
- References being found
- Context being matched
- Summary bullets being extracted
- All agents working in parallel

---

## What Gets Tested

The test suite includes **50+ test cases** across **8 sections**:

### Section 1: Chart Agent — All Diagram Types
Tests every Mermaid diagram type supported:
- **Pie charts** (revenue breakdown)
- **Bar charts** (quarterly metrics)
- **Mindmaps** (strategic initiatives)
- **Timeline** (product milestones)
- **Quadrant charts** (customer maturity)
- **Currency data** ($1.4M, $890K)
- **Percentage data** (112%, 74.2%)
- **Numeric trends** (growth, headcount)

### Section 2: Reference Agent
Tests reference/citation finding:
- Single source (McKinsey)
- Research papers (Harvard)
- Gartner Magic Quadrant
- Industry benchmarks
- Synthetic data validation

### Section 3: Context Agent
Tests organizational context retrieval:
- Email mentions (churn, pipeline)
- Document mentions (board deck, roadmap)
- Calendar events (meetings, deadlines)
- Slack messages (engineering updates, decisions)
- Person mentions (multiple stakeholders)

### Section 4: Summary Agent
Tests extraction of:
- **Key points** (critical insights)
- **Decisions** (strategic choices)
- **Action items** (tasks with owners)
- **Questions** (open issues)

### Section 5: Agent Combinations
Tests parallel dispatch of multiple agents:
- Chart + Reference (e.g., growth metric + industry benchmark)
- Chart + Context (e.g., hiring numbers + plan document)
- Chart + Summary (e.g., metrics + strategic decision)
- 3-agent combos (Reference + Context + Summary)
- **All 4 agents** (realistic QBR scenario)

### Section 6: Edge Cases
Tests resilience:
- No actionable content (should return nothing)
- Ambiguous numbers (fuzzy matching)
- Multi-sentence statements (mixed intents)
- Very long statements (stress test)

### Section 7: Performance & Responsiveness
**Rapid-fire tests** with shorter wait times to validate speed:
- Sub-4-second chart generation
- Parallel agent execution
- WebSocket responsiveness

### Section 8: Real-World Scenarios
Tests in business context:
- Sales pitch (churn reduction + competitive advantage)
- Board discussion (Rule of 40, competitive threats, FedRAMP)
- Customer crisis (save plan, dedicated support)
- Engineering standup (velocity, MTTR, incident response)

---

## How to Speak Into the Mic

**This test suite is currently automated (text-based).** To speak into the mic instead:

### Option A: Interactive Mode (Recommended)
Start the dev server and use the browser UI directly:
```bash
npm run dev:corporate
```
Then open `http://localhost:3000` and click the mic button to speak naturally. The app will classify intents and route to agents in real-time.

### Option B: Add Voice Input to the Test Script
If you want to modify the test script to accept microphone input, you would:
1. Connect to the browser's Web Audio API via WebSocket
2. Capture audio from `navigator.mediaDevices.getUserMedia()`
3. Send audio chunks to Deepgram for transcription
4. Feed transcribed text to the orchestrator

This is a more advanced integration but would allow true "speak and test" experience. Let me know if you'd like me to implement this.

---

## Understanding the Output

When you run `npm run test:exhaustive`, you'll see:

```
══════════════════════════════════════════════════════════════════════════
Test 1/50: 1.1: PIE CHART — Revenue breakdown
──────────────────────────────────────────────────────────────────────────
📝 "Our revenue is split: 68% enterprise, 22% mid-market, 10% SMB."
🎯 Expected: chart
⏱️  Response time: 847ms
✅ Orchestrator processed successfully
⏳ Waiting 4000ms for agents to complete...
```

And in the browser, you'll see:
- 🟠 Orange cards for context matches
- 🔵 Blue cards for references
- 📊 Charts appearing with Mermaid diagrams
- ✅ Summary bullets with categories (key_point, decision, action_item, question)

### Final Summary
```
════════════════════════════════════════════════════════════════════════════
  TEST SUITE COMPLETE
════════════════════════════════════════════════════════════════════════════

📈 Results:
   Total tests run: 50
   Chart agent responses: 23
   Reference agent responses: 8
   Context agent responses: 12
   Summary agent responses: 15
   Total agent responses: 58

View full results at: http://localhost:3000/?session=test-exhaustive-1710853042123
```

---

## Customizing Tests

### Add Your Own Test Cases
Edit `test-exhaustive.ts` and add to the `TEST_CASES` array:

```typescript
{
  name: 'YOUR TEST NAME',
  text: 'Your spoken/typed text here',
  expectedAgents: ['chart', 'summary'],  // What should trigger
  expectedChartType: 'pie',               // Optional
  wait: 4000,                             // How long to wait for response
}
```

### Run Specific Test Sections
Modify the loop in `runTestSuite()`:
```typescript
// Run only Section 1 (Chart Types)
const SECTION_1_TESTS = TEST_CASES.slice(0, 8);
for (const test of SECTION_1_TESTS) {
  await runTest(test, ...);
}
```

### Adjust Wait Times
If agents are slow, increase `wait` times. If they're fast, decrease them:
```typescript
{
  name: 'Performance test',
  text: 'Revenue grew 40 percent',
  expectedAgents: ['chart'],
  wait: 3000,  // Changed from 4000
}
```

---

## Performance Benchmarks

Expected response times (from the test output):

| Scenario | Expected Time |
|----------|--------------|
| Single chart | 800-1200ms |
| Single reference | 600-1000ms |
| Context match (email) | 50-200ms |
| Summary extraction | 400-800ms |
| 2-agent combo | 1200-1800ms |
| 3-agent combo | 1500-2200ms |
| 4-agent combo | 1800-2500ms |

If you see slower times, check:
- Network latency (WebSocket logs)
- Gemini API latency (check server console)
- Browser CPU usage (open DevTools Performance tab)

---

## Debugging

### Check Server Logs
Terminal 1 (dev server) shows:
```
[Orchestrator] Gemini invoked 2 skills: ['generate_chart', 'find_references']
[Chart Service] Generating with prompt: ...
[Reference Service] Query: McKinsey SaaS benchmarks
```

### Check WebSocket Messages
In browser DevTools → Network → WS → Messages:
- `agent:status` with `processing` / `complete` / `error`
- `agent:chart`, `agent:reference`, `agent:context`, `agent:summary` payloads
- `transcript:update` with recognized text

### Check Failing Tests
If a test doesn't produce expected agents:
1. Check if keywords in the text match keywords in the mock data
2. Check MIN_SCORE_THRESHOLD in context.service.ts (default 0.3)
3. Review the Orchestrator system prompt in src/services/orchestrator/prompts.ts
4. Enable MOCK_MODE in server.ts to see deterministic responses

---

## Environment Variables

```bash
# Use a different dataset
DEMO_MODE=default npm run test:exhaustive    # FinTech/PE scenario
DEMO_MODE=keynote npm run test:exhaustive    # Keynote presentation scenario
DEMO_MODE=corporate npm run test:exhaustive  # SaaS company (default)

# Verbose logging
DEBUG=* npm run test:exhaustive
```

---

## Test Scenarios You Can Manually Try

After running the automated suite, try speaking these into the mic for real-time testing:

1. **Financial**: "Our ARR is $42 million, up 38% year-over-year"
2. **Competitive**: "According to Gartner, anomaly detection is critical"
3. **Customer**: "Check Meridian Health's renewal status in our CRM"
4. **Hiring**: "We need to approve the 36-person H1 2026 hiring plan by Friday"
5. **Complex**: "The board asked three things: Rule of 40, Chainlink threat, and FedRAMP timeline"

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests hang | Check WebSocket server is running (Terminal 1) |
| 0 agents triggered | Verify keywords in test text match mock data |
| Slow responses | Increase wait times, check network latency |
| Gemini errors | Verify GEMINI_API_KEY in .env.local |
| Session not found in UI | Copy exact session ID from terminal output |
| Charts not rendering | Check Mermaid syntax in chart service response |

---

## Next Steps

- **Add voice input**: Integrate browser Web Audio API for true "speak and test" experience
- **Add performance profiling**: Track latency by agent type and diagram type
- **Expand datasets**: Add more mock emails, docs, calendar events
- **Add failure injection**: Test error handling with malformed responses
- **Visual regression**: Screenshot each test case for UI consistency

Let me know if you'd like me to implement any of these enhancements!
