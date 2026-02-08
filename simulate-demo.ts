import WebSocket from 'ws';
// @ts-ignore
import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:3000/api/orchestrator';
const WS_URL = 'ws://localhost:3000/ws';
const SESSION_ID = 'simulation-test-session';

// The Script (from demo_guide.md)
const DEMO_SCRIPT = [
    {
        text: "Good morning. Let's start with the Q3 performance for Fund III. I'm pleased to report we are tracking well above benchmark, with a Net IRR of 22.4%.",
        expect: "DATA_CLAIM / Chart",
        wait: 3000
    },
    {
        text: "The primary driver of this alpha is Vertex AI, which was marked up 140% year-to-date following their Series B.",
        expect: "DATA_CLAIM / Chart",
        wait: 3000
    },
    {
        text: "Moving to the main agenda: Project Blue Sky. As detailed in the Investment Committee Memo, we propose acquiring OmniCorp for $1.2 Billion.",
        expect: "DOC_MENTION / Document",
        wait: 3000
    },
    {
        text: "Evelyn, regarding your question on regulatory risk. We've reviewed the Due Diligence Report from KPMG, and the antitrust exposure in the EU is deemed low.",
        expect: "REFERENCE / Document",
        wait: 3000
    },
    {
        text: "Rajiv, you'll be interested in the cohort analysis. Our data confirms a Net Dollar Retention of 118%, validating the pricing power.",
        expect: "EMAIL_MENTION / Email",
        wait: 3000
    },
    {
        text: "Despite the volatility index sitting at 24.5, we believe this is a resilient asset. We recommend proceeding with the Binding Offer by Friday.",
        expect: "DECISION / Summary",
        wait: 3000
    }
];

async function runSimulation() {
    console.log(`🚀 Starting Simulation: Apex Horizon Capital Demo`);
    console.log(`\n⚠️  IMPORTANT: Open this URL in your browser to see the results:`);
    console.log(`👉 http://localhost:3000/?session=${SESSION_ID}\n`);

    console.log(`Connecting to WebSocket: ${WS_URL}...`);

    const ws = new WebSocket(WS_URL);

    await new Promise<void>((resolve) => {
        ws.on('open', () => {
            console.log('✅ WebSocket Connected');
            // Initialize session
            ws.send(JSON.stringify({ event: 'session:start', sessionId: SESSION_ID }));
            resolve();
        });
    });

    ws.on('message', (data: any) => {
        const msg = JSON.parse(data.toString());
        console.log(`\n🤖 AI Response [${msg.event}]:`);
        console.dir(msg.payload, { depth: 1, colors: true });
    });

    // Iterate through script
    for (const step of DEMO_SCRIPT) {
        console.log(`\n---------------------------------------------------------`);
        console.log(`🗣️  Speaker: "${step.text}"`);
        console.log(`🎯 Expecting: ${step.expect}`);

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
            console.log(`✅ Orchestrator processed in ${duration}ms`);
            // console.log('Orchestrator Response:', data);

        } catch (err) {
            console.error('❌ Error sending text:', err);
        }

        console.log(`⏳ Waiting ${step.wait}ms for UI update...`);
        await new Promise((r) => setTimeout(r, step.wait));
    }

    console.log(`\n---------------------------------------------------------`);
    console.log(`✅ Simulation Complete.`);
    ws.close();
    process.exit(0);
}

runSimulation();
