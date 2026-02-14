import WebSocket from 'ws';

/**
 * 🎤 Momentum Keynote Demo Simulation
 * 
 * This script simulates a live keynote presentation where Momentum
 * PROVES ITS OWN VALUE by surfacing relevant context as the presenter speaks.
 * 
 * The meta-demo: "We built software for presentations... 
 *                 and here it is, working during our presentation."
 */

const API_URL = 'http://localhost:3000/api/orchestrator';
const WS_URL = 'ws://localhost:3000/ws';
const SESSION_ID = 'keynote-demo-session';

// ═══════════════════════════════════════════════════════════════════════════════
// 🎬 THE KEYNOTE SCRIPT
// Each step represents something the presenter says.
// Momentum will detect intents and surface relevant context in real-time.
// ═══════════════════════════════════════════════════════════════════════════════

const KEYNOTE_SCRIPT = [
    // ─────────────────────────────────────────────────────────────────────────────
    // ACT 1: THE PROBLEM (Hook the audience)
    // ─────────────────────────────────────────────────────────────────────────────
    {
        section: '🎯 ACT 1: THE PROBLEM',
        text: "Let me start with a question. How many hours do you think professionals waste in unproductive meetings each month? The answer is 31 hours. That's almost four full workdays.",
        expect: "DATA_CLAIM → Chart showing meeting time stats",
        wait: 4000
    },
    {
        text: "And the cost? According to our research document on the meeting problem, companies lose $37 billion annually to meeting inefficiency.",
        expect: "DOC_MENTION → The $37B Meeting Problem.pdf",
        wait: 4000
    },
    {
        text: "You've all experienced it. Sarah sent me an email yesterday saying she spent 6 hours in meetings and got nothing done. Her calendar was a wall of blue.",
        expect: "EMAIL_MENTION → Sarah's email about meeting overload",
        wait: 4000
    },
    {
        text: "The core issue is context switching. Marcus mentioned he spent 23 minutes searching for a document someone referenced in a call. By the time he found it, the conversation had moved on.",
        expect: "EMAIL_MENTION → Marcus's email + DATA_CLAIM → Context switch time",
        wait: 4000
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // ACT 2: THE SOLUTION (Reveal Momentum)
    // ─────────────────────────────────────────────────────────────────────────────
    {
        section: '💡 ACT 2: THE SOLUTION',
        text: "This brings me to our key decision today: we need real-time intelligence during presentations, not after them. We need Momentum.",
        expect: "DECISION → Summary card highlighting the key decision",
        wait: 4000
    },
    {
        text: "What if your presentation software could understand what you're saying and instantly surface the right documents, emails, and data visualizations?",
        expect: "KEY_POINT → Summary of the value proposition",
        wait: 3000
    },
    {
        text: "Let's shift topics to how it actually works. Check out our technical architecture document.",
        expect: "TOPIC_SHIFT + DOC_MENTION → Architecture doc",
        wait: 4000
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // ACT 3: THE TECHNOLOGY (Technical Deep Dive)
    // ─────────────────────────────────────────────────────────────────────────────
    {
        section: '🔧 ACT 3: THE TECHNOLOGY',
        text: "Momentum uses 9 different intent types to understand what you're saying: from data claims and document mentions to decisions and action items.",
        expect: "DATA_CLAIM → Chart showing 9 intent types",
        wait: 4000
    },
    {
        text: "Our orchestrator routes each intent to one of 4 specialized AI agents: Chart, Context, Summary, and Reference. All running in parallel.",
        expect: "DATA_CLAIM → Chart showing 4 agents",
        wait: 4000
    },
    {
        text: "The websocket pipeline delivers updates in under 200 milliseconds end-to-end. That's faster than you can blink.",
        expect: "DATA_CLAIM → Latency visualization",
        wait: 4000
    },
    {
        text: "Our dev team confirmed in Slack that all systems are go. Intent classification accuracy is at 94 percent.",
        expect: "REFERENCE → Slack message about readiness + DATA_CLAIM → 94% accuracy",
        wait: 4000
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // ACT 4: THE META-MOMENT (Mind = Blown)
    // ─────────────────────────────────────────────────────────────────────────────
    {
        section: '🤯 ACT 4: THE META-MOMENT',
        text: "Here's the beautiful part: everything I've been saying during this presentation? Momentum has been processing it in real-time. Look at the context panel.",
        expect: "KEY_POINT → Explanation of the meta-demo",
        wait: 5000
    },
    {
        text: "We didn't just build software for presentations. We built software that proves itself BY WORKING during presentations. That's the Momentum difference.",
        expect: "KEY_POINT → The value proposition crystallized",
        wait: 4000
    },

    // ─────────────────────────────────────────────────────────────────────────────
    // ACT 5: THE CLOSE (Call to Action)
    // ─────────────────────────────────────────────────────────────────────────────
    {
        section: '🚀 ACT 5: THE CLOSE',
        text: "Alex from our pilot program called this 'mindblowing'. He asked when they can deploy it.",
        expect: "EMAIL_MENTION → Alex's email about being impressed",
        wait: 4000
    },
    {
        text: "Our action item for you: imagine your next big presentation with Momentum. Every claim backed by data. Every reference instantly surfaced. Every decision captured.",
        expect: "ACTION_ITEM → Summary of the call to action",
        wait: 4000
    },
    {
        text: "Questions?",
        expect: "QUESTION → Indicator that Q&A is starting",
        wait: 3000
    }
];

// ═══════════════════════════════════════════════════════════════════════════════
// 🎮 SIMULATION ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

const fetchFn = globalThis.fetch;

async function runKeynoteDemo() {
    if (!fetchFn) {
        throw new Error('Global fetch is not available. Use Node 18+ or add a fetch polyfill.');
    }
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                   ║');
    console.log('║        🎤  MOMENTUM KEYNOTE DEMO SIMULATION  🎤                   ║');
    console.log('║                                                                   ║');
    console.log('║    Watch as Momentum proves its value during this presentation   ║');
    console.log('║                                                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    console.log(`⚠️  IMPORTANT: Open this URL in your browser to see the magic:`);
    console.log(`👉  http://localhost:3000/?session=${SESSION_ID}\n`);

    console.log(`Connecting to WebSocket: ${WS_URL}...`);

    const ws = new WebSocket(WS_URL);

    await new Promise<void>((resolve) => {
        ws.on('open', () => {
            console.log('✅ WebSocket Connected\n');
            ws.send(JSON.stringify({ event: 'session:start', sessionId: SESSION_ID }));
            resolve();
        });
    });

    ws.on('message', (data: any) => {
        const msg = JSON.parse(data.toString());
        console.log(`   🤖 AI Response [${msg.event}]`);
    });

    let currentSection = '';

    for (const step of KEYNOTE_SCRIPT) {
        // Print section header if new section
        if (step.section && step.section !== currentSection) {
            currentSection = step.section;
            console.log('\n');
            console.log('═'.repeat(70));
            console.log(`   ${step.section}`);
            console.log('═'.repeat(70));
        }

        console.log(`\n🗣️  PRESENTER:`);
        console.log(`   "${step.text}"`);
        console.log(`\n   🎯 Expected: ${step.expect}`);

        try {
            const start = Date.now();
            const res = await fetchFn(API_URL, {
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
            console.log(`   ✅ Processed in ${duration}ms`);

        } catch (err) {
            console.error('   ❌ Error:', err);
        }

        console.log(`   ⏳ Pause for ${step.wait}ms...`);
        await new Promise((r) => setTimeout(r, step.wait));
    }

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                   ║');
    console.log('║        🎉  KEYNOTE DEMO COMPLETE  🎉                              ║');
    console.log('║                                                                   ║');
    console.log('║    Thank you for watching Momentum in action!                     ║');
    console.log('║                                                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('\n');

    ws.close();
    process.exit(0);
}

runKeynoteDemo();
