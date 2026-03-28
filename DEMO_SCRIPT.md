# 🎤 EchoLens — VaultPay Board Meeting Demo Script

> **You are:** Sara Chen, CEO of VaultPay, presenting the Q4 2025 Board of Directors Meeting.
> **EchoLens listens** and surfaces charts, emails, docs, Slack threads, and action items in real time.
> **Total runtime:** ~3–4 minutes

---

## ⚙️ SETUP (before you start)

```bash
# Terminal 1 — start the server
DEMO_MODE=fintech npm run dev:ws

# Browser — open this URL
http://localhost:3000/?session=vaultpay-board-q4
```

- Mic should be **on and live** before Step 1
- Keep this script open on a **second screen or tablet**
- Speak at **normal pace** — EchoLens processes every ~3 seconds of audio
- **Pause 3–5 seconds after each step** to let the UI update before continuing

---

## 🟢 STEP 1 — Opening: TPV & Revenue
**Expect on screen:** Chart (card vs ACH take rates, or TPV bar chart) + Summary bullet

**SAY:**
> "Good morning everyone. Let's jump into the numbers. This quarter we processed two point four billion dollars in total payment volume, up 52% year over year. Our blended take rate is 2.1% — that's 2.8% on card transactions and 0.6% on ACH. Net revenue for the quarter came in at fifty point four million."

**👉 Point out to judges:**
*"Watch the right panel — EchoLens just heard those numbers and auto-generated a chart visualizing the card vs ACH split. No template, no manual input."*

---

## 🟢 STEP 2 — Unit Economics
**Expect on screen:** Chart (multi-metric SaaS dashboard)

**SAY:**
> "Marcus, let's walk through unit economics. ARR is at thirty-eight million, up 58% from twenty-four million last year. Net dollar retention is 118%. Gross margin came in at 67.4% and CAC payback is 14 months. Our burn multiple is 1.4x which puts the Rule of 40 at 51 — comfortably above the benchmark."

**👉 Point out to judges:**
*"Six different metrics in one breath — EchoLens parsed all of them and generated a single visualization to represent the health of the business."*

---

## 🔵 STEP 3 — Pipeline & The MedFlow Deal
**Expect on screen:** Email card (MedFlow deal from Dina) + Chart (pipeline vs target) + Calendar (CTO call tomorrow)

**SAY:**
> "Dina, your email shows the weighted pipeline at eleven point four million against an eight million dollar target. Let's talk about the MedFlow Health deal — that's our biggest opportunity at two point two million ACV with a 70% close probability."

**👉 Point out to judges:**
*"The system pulled up the actual email from our CRO about this deal — it's living in the company's data. The chart and the context card appeared simultaneously."*

---

## 🔵 STEP 4 — Fraud & Risk
**Expect on screen:** Email card (Tyler's fraud alert) + Slack card (#risk-ops) + Chart (fraud BPS or auto-block pie)

**SAY:**
> "Tyler, your email flagged a 40% spike in card-testing attacks last month. Fraud basis points went from eight to eleven point two. I also saw the Slack thread from risk-ops — the auto-block system caught 94.3% automatically, but that still left one point eight million dollars in attempted fraud slipping to manual review. What's our exposure?"

**👉 Point out to judges:**
*"Two different sources surfaced at once — an email AND a Slack thread, both relevant to fraud. The chart shows the auto-block rate as a proportion. This is the company's live context, not hardcoded data."*

---

## 🟡 STEP 5 — Decision: Fraud Response
**Expect on screen:** Summary bullets (1 decision + 3 action items with owners) + Context cards (calendar sprint planning, email)

**SAY:**
> "Here's what we've decided. We're fast-tracking the fraud ML model v3 into production by December first — I sent an email to the team about this. Kwame, allocate 20% of the next two sprints to this. Tyler, I need the updated risk thresholds document by end of next week. And Jess, push the PCI DSS 4.0 remediation — we need to be at 90% controls by end of January. Let's schedule a meeting to review progress in two weeks."

**👉 Point out to judges:**
*"Now watch the summary panel — EchoLens extracted the decision and three separate action items with their owners automatically. This is the meeting minutes writing itself."*

---

## 🟣 STEP 6 — Competitive Landscape + External Reference
**Expect on screen:** Reference card (McKinsey report) + Email card (PayGrid intel) + Doc card (competitive analysis) + Chart (win rate comparison)

**SAY:**
> "Now the competitive picture. According to McKinsey's 2024 embedded finance report, the embedded payments market is projected to reach seven trillion dollars by 2030. Our win rate against PayGrid dropped from 72% to 58% last quarter after they closed their ninety million dollar Series C. Dina's email on competitive intel and the competitive analysis document both show they're winning on onboarding speed — fourteen days versus our twenty-one."

**👉 Point out to judges:**
*"Three things happened: it found an external McKinsey source, pulled up our internal competitive intel email, and surfaced the competitive analysis doc — all from a single spoken sentence. Plus a chart of our win rate decline."*

---

## 🔵 STEP 7 — Product: Instant Payouts
**Expect on screen:** Slack card (#product) + Calendar card (PropConnect go-live) + Chart (NPS before/after or settlement time)

**SAY:**
> "Jess mentioned in Slack that the instant payouts beta is showing incredible results. Twelve merchants are live, average settlement time is down to 28 seconds from the standard two-day cycle. NPS among beta participants jumped from 52 to 83. Volume is growing 340% week over week. PropConnect wants to be the first GA customer."

**👉 Point out to judges:**
*"Heard 'Slack' and 'PropConnect' — immediately surfaced the relevant Slack thread and the PropConnect go-live meeting on the calendar. The chart shows the before/after NPS lift."*

---

## 🔵 STEP 8 — Incident Review
**Expect on screen:** Doc card (postmortem) + Slack card (#engineering fix) + Chart (latency spike vs SLA)

**SAY:**
> "We need to address the October 15th latency spike. The postmortem document shows that P99 latency hit twelve hundred milliseconds for 47 minutes — our SLA is 200 milliseconds. Twenty-three merchants were affected. Kwame sent me an email about the root cause — a payment gateway failover misconfiguration. I also saw the Slack thread about the fix. Walk us through what we deployed."

**👉 Point out to judges:**
*"The postmortem doc appeared on screen automatically. This is a 1,200ms vs 200ms SLA breach — the chart makes that gap visual instantly. The Slack update from engineering showing the fix is right there too."*

---

## 🔵 STEP 9 — Financial Planning & Runway
**Expect on screen:** Doc card (2026 financial model) + Slack card (#finance) + Chart (3-scenario ARR comparison)

**SAY:**
> "Marcus, the 2026 financial planning document shows three scenarios. Base case: sixty-two million ARR with 63% growth. Upside case: seventy-eight million. Downside: forty-eight million. At our current burn of two point six million per month, we have 26 months of runway. I saw in Slack that the board will want to see the bridge to break-even in Q2 2027."

**👉 Point out to judges:**
*"Three scenarios, one chart. The financial model doc and the CFO's Slack update both surfaced because the system understood this was about the 2026 plan. All of this came from what I just said out loud."*

---

## 🟡 STEP 10 — Closing: Action Items
**Expect on screen:** Summary bullets (4 action items with owners) + Doc card (board deck) + Calendar cards (CTO call, next board meeting)

**SAY:**
> "Let's close it out. Marcus, send me the final board deck document by Wednesday — make sure the cohort analysis is updated. Dina, lock the MedFlow terms before the meeting with their CTO tomorrow — check the calendar invite. Tyler, email me the compliance roadmap by end of day Monday. Kwame, I want the fraud model v3 production timeline documented. Next board meeting is scheduled for January fifteenth. Great quarter everyone."

**👉 Point out to judges:**
*"Four action items, four owners, extracted automatically. The board deck doc, the CTO alignment meeting, and the next board date all surfaced from a single closing statement. This is what EchoLens does — the meeting documents itself."*

---

## 🔧 RECOVERY TIPS

**If a chart doesn't appear:**
- The chart panel updates asynchronously — wait 3–5 seconds
- If nothing after 5s, mention the numbers again: *"So just to be clear on that data point — we're talking sixty-two million versus seventy-eight million..."*

**If no context cards appear:**
- Make sure you said "email", "Slack", "document", "meeting", or "calendar" in the sentence
- Fallback: *"Let me reference the email on this..."* then re-say the key sentence

**If the summary panel is empty:**
- Make sure you said action-trigger words: "decided", "need to", "should", "action item", "I want you to", "by end of"
- Fallback: *"So to be very clear — we've decided that..."*

**If the reference card doesn't show:**
- Make sure you said "according to [source]" or "the [name] report"
- Fallback: *"According to the McKinsey embedded finance report..."*

---

## 📋 QUICK REFERENCE: What each step shows

| # | Topic | Chart | Context | Summary | Reference |
|---|-------|-------|---------|---------|-----------|
| 1 | TPV & Revenue | ✅ | — | ✅ | — |
| 2 | Unit Economics | ✅ | — | — | — |
| 3 | Pipeline / MedFlow | ✅ | ✅ Email + Cal | — | — |
| 4 | Fraud & Risk | ✅ | ✅ Email + Slack | — | — |
| 5 | Fraud Decisions | — | ✅ Email + Cal | ✅ | — |
| 6 | Competition | ✅ | ✅ Email + Doc | — | ✅ |
| 7 | Instant Payouts | ✅ | ✅ Slack + Cal | — | — |
| 8 | Incident Review | ✅ | ✅ Doc + Slack | — | — |
| 9 | Financial Plan | ✅ | ✅ Doc + Slack | — | — |
| 10 | Closing Actions | — | ✅ Doc + Cal | ✅ | — |

---

*VaultPay, Inc. — Q4 2025 Board of Directors Meeting*
*EchoLens Demo — Hackathon Build*
