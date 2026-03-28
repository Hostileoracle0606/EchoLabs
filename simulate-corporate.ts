import WebSocket from 'ws';
// @ts-ignore
import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:3000/api/orchestrator';
const WS_URL = 'ws://localhost:3000/ws';
const SESSION_ID = 'corporate-qbr-session';

/**
 * NovaBridge Technologies — Q4 2025 Quarterly Business Review
 *
 * Participants:
 *   CEO (speaker), Lena Vasquez (CRO), Raj Subramanian (CTO),
 *   Natasha Kim (CFO), Derek Okonkwo (VP Sales), Priya Nair (VP Product)
 *
 * This script simulates a realistic 12-step QBR meeting that exercises
 * all four EchoLens agents: chart, summary, context, reference.
 */
const DEMO_SCRIPT = [
    // --- Opening: ARR & Growth ---
    {
        text: "Good afternoon everyone, welcome to the Q4 QBR. Let's start with the headline numbers. We closed the quarter at $42 million ARR, up 38% year over year, with 22 net new logos.",
        expect: "DATA_CLAIM / Chart + Summary (key_point)",
        wait: 4000
    },
    // --- Financial Health ---
    {
        text: "Natasha, walk us through the unit economics. Our Net Dollar Retention is 112%, gross margin came in at 74.2%, and CAC payback is sitting at 18 months. The burn multiple is 1.6x which puts our Rule of 40 at 36 — just under the benchmark.",
        expect: "DATA_CLAIM / Chart (multiple metrics)",
        wait: 4000
    },
    // --- Pipeline & Sales ---
    {
        text: "Derek, your pipeline update. I see from your email that the weighted pipeline is $8.2 million against a $6.5 million target. Tell us about the GreenField Energy deal — that's our biggest at $1.4 million.",
        expect: "EMAIL_MENTION / Context (email) + DATA_CLAIM / Chart",
        wait: 4000
    },
    // --- Customer Churn Risk ---
    {
        text: "Now the hard part. Lena, you flagged three enterprise renewals at risk — Meridian Health, TrueNorth Logistics, and Pinnacle Manufacturing. That's over a million dollars of ARR in jeopardy. What's the save plan?",
        expect: "EMAIL_MENTION / Context (churn email + slack)",
        wait: 4000
    },
    // --- Decision: Customer Save ---
    {
        text: "Agreed. We'll commit a dedicated CSM to Meridian for 90 days and schedule the executive save call with their new VP of Ops on Wednesday. Lena, you own the TrueNorth competitive displacement — I want a battlecard response by Friday.",
        expect: "DECISION + ACTION_ITEM / Summary",
        wait: 4000
    },
    // --- Competitive Threat ---
    {
        text: "Speaking of competition, Priya's competitive analysis shows our win rate against Chainlink AI dropped from 68% to 54% last quarter. According to Gartner's latest supply chain technology report, real-time anomaly detection is now table stakes for enterprise buyers.",
        expect: "REFERENCE / Reference (Gartner) + DOC_MENTION / Context (competitive analysis)",
        wait: 4000
    },
    // --- Product Update ---
    {
        text: "Raj, update on Anomaly Detection v2. I saw in Slack that the alpha is passing integration tests and latency is down to 180 milliseconds from 340. When can we get this into customer hands?",
        expect: "DOC_MENTION / Context (slack, roadmap) + DATA_CLAIM / Chart",
        wait: 4000
    },
    // --- Engineering Metrics ---
    {
        text: "The engineering monthly report shows sprint velocity at 94 points, deployment frequency at 4.2 per day, and MTTR at 38 minutes. But the October 28th P1 outage dropped our uptime to 99.91% — below the 99.95 target. Walk us through the postmortem.",
        expect: "DATA_CLAIM / Chart + DOC_MENTION / Context (postmortem doc)",
        wait: 4000
    },
    // --- Decision: Reliability Investment ---
    {
        text: "We've decided to allocate 25% of the next sprint to reliability work — circuit breakers, rate limiters, and canary deployments for all batch jobs. Raj, work with Priya to reprioritize the roadmap accordingly. Target is zero P1 incidents in Q1.",
        expect: "DECISION + ACTION_ITEM / Summary",
        wait: 4000
    },
    // --- Financial Planning ---
    {
        text: "Natasha, the 2026 financial plan shows three scenarios — base case at $58 million, upside at $65 million, downside at $50 million. At current burn of $2.8 million per month, we have 22 months of runway. The board will ask about our bridge to profitability.",
        expect: "DOC_MENTION / Context (financial model) + DATA_CLAIM / Chart",
        wait: 4000
    },
    // --- Headcount & Budget ---
    {
        text: "Monica's hiring plan proposes 36 net new hires in H1 2026 — 18 in engineering, 12 in sales, and 6 in customer success. Total comp impact is $4.8 million annually. Our engineering-to-employee ratio is 42%, below the 50% benchmark. We need board approval by December 15th.",
        expect: "EMAIL_MENTION / Context (hiring email) + DATA_CLAIM / Chart + ACTION_ITEM / Summary",
        wait: 4000
    },
    // --- Closing: Board Prep ---
    {
        text: "To close — the board deck is ready for final review. Key message: we're on a clear path to $58 million ARR, NDR is strong, pipeline is healthy, and we're investing to close the competitive gap. Natasha, circulate the final deck by Wednesday. Everyone, prep your sections. Board meeting is Thursday at 9 AM.",
        expect: "DOC_MENTION / Context (board deck) + ACTION_ITEM / Summary + DECISION",
        wait: 3000
    }
];

async function runSimulation() {
    console.log(`\n========================================================`);
    console.log(`  NovaBridge Technologies — Q4 2025 Quarterly Business Review`);
    console.log(`  Simulating a 12-step corporate QBR meeting`);
    console.log(`========================================================\n`);
    console.log(`  Open this URL in your browser to see the results:`);
    console.log(`  http://localhost:3000/?session=${SESSION_ID}\n`);

    console.log(`Connecting to WebSocket: ${WS_URL}...`);

    const ws = new WebSocket(WS_URL);

    await new Promise<void>((resolve) => {
        ws.on('open', () => {
            console.log('Connected to WebSocket\n');
            ws.send(JSON.stringify({ event: 'session:start', sessionId: SESSION_ID }));
            resolve();
        });
    });

    ws.on('message', (data: any) => {
        const msg = JSON.parse(data.toString());
        const agent = msg.event.replace('agent:', '').toUpperCase();
        if (msg.event.startsWith('agent:')) {
            console.log(`    [${agent}] result received`);
        }
    });

    for (let i = 0; i < DEMO_SCRIPT.length; i++) {
        const step = DEMO_SCRIPT[i];
        console.log(`---------------------------------------------------------`);
        console.log(`Step ${i + 1}/${DEMO_SCRIPT.length}`);
        console.log(`  "${step.text.slice(0, 100)}${step.text.length > 100 ? '...' : ''}"`);
        console.log(`  Expecting: ${step.expect}`);

        try {
            const start = Date.now();
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: step.text,
                    sessionId: SESSION_ID,
                    timestamp: Date.now()
                })
            });

            const data = await res.json();
            const duration = Date.now() - start;
            console.log(`  Processed in ${duration}ms`);

        } catch (err) {
            console.error('  Error:', err);
        }

        console.log(`  Waiting ${step.wait}ms...\n`);
        await new Promise((r) => setTimeout(r, step.wait));
    }

    console.log(`=========================================================`);
    console.log(`  Simulation Complete.`);
    console.log(`=========================================================`);
    ws.close();
    process.exit(0);
}

runSimulation();
