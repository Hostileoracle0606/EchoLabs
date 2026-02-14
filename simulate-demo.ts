import WebSocket from 'ws';
// @ts-ignore
import fetch from 'node-fetch';

// Configuration
const API_URL = 'http://localhost:3000/api/orchestrator';
const WS_URL = 'ws://localhost:3000/ws';
const SESSION_ID = 'simulation-test-session';

const DEMO_SCRIPT = [
    {
        text: "Thanks for the time today. I'd love to understand your current workflow and pain points.",
        expect: "Discovery stage + coaching tips",
        wait: 3000
    },
    {
        text: "We're concerned about implementation timelines and how onboarding would work.",
        expect: "Objection + buying signals",
        wait: 3000
    },
    {
        text: "Pricing might be too expensive for our budget right now.",
        expect: "Price objection + compliance warning",
        wait: 3000
    },
    {
        text: "How do we get started and what are the next steps?",
        expect: "Next steps + buying signal",
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
