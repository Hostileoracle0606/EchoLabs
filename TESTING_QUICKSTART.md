# 🧪 Testing EchoLens — Quick Start

## 30-Second Setup

```bash
# Terminal 1: Start the server
npm run dev:corporate

# Terminal 2: Run exhaustive tests
npm run test:exhaustive

# Browser: Open the URL from Terminal 2 output
http://localhost:3000/?session=test-exhaustive-<TIMESTAMP>
```

That's it! You'll see 38+ test cases running, exercising all features.

---

## What You'll See

### In Terminal 2 (Test Results)
```
Test 1/38: 1.1: PIE CHART — Revenue breakdown
📝 "Our revenue is split: 68% enterprise, 22% mid-market, 10% SMB."
🎯 Expected: chart
⏱️  Response time: 847ms
✅ Orchestrator processed successfully
```

### In Browser
- 📊 Charts being generated (pie, bar, mindmap, timeline, quadrant)
- 📄 References being found (Gartner, McKinsey, etc.)
- 📧 Context matches (emails, docs, calendar, Slack)
- ✅ Summary bullets (key points, decisions, action items, questions)
- 🎯 All agents firing in parallel for complex statements

### At the End
```
📈 Results:
   Total tests run: 38
   Chart agent responses: 18
   Reference agent responses: 6
   Context agent responses: 9
   Summary agent responses: 12
   Total agent responses: 45
```

---

## Test Coverage

| Section | Tests | Focus |
|---------|-------|-------|
| **1. Chart Types** | 8 | Pie, bar, mindmap, timeline, quadrant, currency, %, numbers |
| **2. References** | 4 | McKinsey, Harvard, Gartner, benchmarks |
| **3. Context** | 5 | Emails, docs, calendar, Slack, people |
| **4. Summary** | 4 | Key points, decisions, actions, questions |
| **5. Combinations** | 5 | 2-agent, 3-agent, 4-agent parallel dispatch |
| **6. Edge Cases** | 4 | No content, ambiguous, multi-sentence, stress |
| **7. Performance** | 4 | Rapid-fire, latency validation |
| **8. Real-World** | 4 | Sales pitch, board, crisis, standup |

**Total: 38 test cases**

---

## For Manual Voice Testing

Instead of running the automated suite, you can speak into the mic directly:

```bash
npm run dev:corporate
```

Then open `http://localhost:3000` and click the **🎤 mic button** to speak naturally.

Try these phrases:
- "Our revenue is $42 million, up 38% year-over-year"
- "According to McKinsey, top-quartile SaaS companies maintain NDR above 120%"
- "Check the board deck for latest metrics"
- "We have decided to allocate 25% of next sprint to reliability work"
- "Our pipeline is $8.2M against a $6.5M target, led by GreenField Energy"

---

## Expected Performance

| Agent | Response Time |
|-------|---------------|
| Chart generation | 800-1200ms |
| Reference lookup | 600-1000ms |
| Context search | 50-200ms |
| Summary extraction | 400-800ms |
| 2-agent combo | 1200-1800ms |
| 4-agent combo | 1800-2500ms |

If responses are slower, check:
1. Is the WebSocket server running? (Terminal 1)
2. Network latency (open DevTools → Network)
3. Gemini API latency (check server logs in Terminal 1)

---

## Customize Tests

Edit `test-exhaustive.ts` to:

### Add a custom test case:
```typescript
{
  name: 'My custom test',
  text: 'Your test text here',
  expectedAgents: ['chart', 'summary'],
  wait: 4000,
}
```

### Run only one section:
```typescript
// In runTestSuite(), change:
// for (let i = 0; i < TEST_CASES.length; i++) {
// to:
const SECTION_1 = TEST_CASES.slice(0, 8);
for (let i = 0; i < SECTION_1.length; i++) {
```

### Change wait times:
```typescript
// For faster systems, reduce from 4000 to 2000ms
wait: 2000,
```

---

## Datasets Available

```bash
npm run test:exhaustive                    # Corporate (default)
DEMO_MODE=default npm run test:exhaustive  # Finance/PE firm
DEMO_MODE=keynote npm run test:exhaustive  # Keynote presentation
```

---

## Debugging

**See agent logs:**
Check Terminal 1 (dev server) output:
```
[Orchestrator] Gemini invoked 2 skills: ['generate_chart', 'find_references']
[Chart Service] Generating with prompt: ...
```

**See WebSocket messages:**
Browser DevTools → Network → WS → Messages tab

**Check failing tests:**
1. Verify keywords in test text match keywords in mock data
2. Check context.service.ts for MIN_SCORE_THRESHOLD (default 0.3)
3. Review orchestrator prompts in src/services/orchestrator/prompts.ts

---

## Shortcuts

```bash
# Start dev server with corporate data
npm run dev:corporate

# Run automated tests
npm run test:exhaustive

# Run with different dataset
DEMO_MODE=default npm run test:exhaustive
DEMO_MODE=keynote npm run test:exhaustive

# Watch all tests in one terminal (dev server + tests)
npm run dev:corporate & sleep 2 && npm run test:exhaustive
```

---

## Files

- **[test-exhaustive.ts](test-exhaustive.ts)** — Main test script (38 test cases)
- **[TEST_GUIDE.md](TEST_GUIDE.md)** — Detailed documentation
- **[mock-corporate.json](src/data/mock-corporate.json)** — Test data (emails, docs, calendar, Slack)
- **[TESTING_QUICKSTART.md](TESTING_QUICKSTART.md)** — This file

---

## Next Steps

1. Run the tests: `npm run test:exhaustive`
2. Open the browser URL to watch in real-time
3. Check Terminal 1 for orchestrator logs
4. Edit test cases in `test-exhaustive.ts` to customize
5. Speak into the mic at `http://localhost:3000` for interactive testing

Enjoy testing! 🚀
