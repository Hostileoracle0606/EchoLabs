
import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

// Load .env manually since we're running with tsx
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

// MOCK WebSocket Broadcast to capture events
const broadcastEvents: { event: string, payload: any, time: number }[] = [];
// We need to intercept the broadcast function. 
// Since we import orchestrator, we need to mock 'broadcast' in 'ws-server' BEFORE importing orchestrator.
// But ESM modules are immutable. 
// WORKAROUND: We will attach a listener to a global object or similar if possible, 
// OR we just intercept via a proxy if we could. 
// Simpler: We'll overwrite the broadcast function in the module cache if using CommonJS, 
// but with TSX/ESM it's harder.
// ALTERNATIVE: orchestrator imports `broadcast` from `@/websocket/ws-server`.
// We can try to rely on the fact that `broadcast` might log to console?
// Let's use a spy approach if possible, but failing that, we'll just measure the *return* of processTranscript 
// which now returns immediately? No, processTranscript awaits.
// WAIT: The Zero-Shot chart is broadcasted *inside* processTranscript.
// To measure it, we need to hook into `broadcast`.
// Let's try to mock the module via a test-like setup or just assume the log output?
// Actually, let's just inspect the console logs? No, we need numbers.

// Let's modify the script to use a patched version of `ws-server` if possible, 
// OR just rely on the fact that `measure-latency.ts` is running in node, 
// we can monkey-patch `process.stdout.write` to capture logs? 
// "Zero-Shot Chart Matches!" is logged.

async function run() {
    const { processTranscript } = await import('../src/services/orchestrator/orchestrator.service');

    console.log('🚀 Starting Latency Benchmark for Agentic Workflow (Phase 3: Zero-Shot)...');
    console.log(`Checking API Key: ${process.env.GEMINI_API_KEY ? '✅ FOUND' : '❌ MISSING'}`);

    // Monkey-patch console.log to capture Zero-Shot timing
    const originalLog = console.log;
    let zeroShotTime = 0;
    let startTime = 0;

    console.log = (...args) => {
        const msg = args.join(' ');
        if (msg.includes('Zero-Shot Chart Matches!')) {
            zeroShotTime = performance.now();
            process.stdout.write(` [⚡ Zero-Shot detected at ${(zeroShotTime - startTime).toFixed(2)}ms] `);
        }
        // originalLog(...args); // Keep silent for cleaner output or uncomment
    };

    const QUERIES = [
        { text: "Revenue grew 40% last quarter", type: "Chart (Data Claim)" },
        { text: "Sales hit 150 million users", type: "Chart (Data Claim)" },
        { text: "We decided to launch the product in Q3", type: "Summary (Decision)" },
        { text: "According to the 2024 strategic plan document", type: "Reference (Doc)" },
    ];

    const results: { type: string, fullDuration: number, zeroShotDuration?: number }[] = [];

    // Warmup
    process.stdout.write('\n🔥 Warming up...');
    try {
        await processTranscript({
            text: "Warmup query",
            sessionId: "warmup-session",
            timestamp: Date.now()
        });
    } catch (e) { }
    process.stdout.write(' Done.\n');

    console.log('\n📊 Running Benchmark...');

    for (const query of QUERIES) {
        process.stdout.write(`Processing: "${query.text.substring(0, 40)}..." [${query.type}] `);

        zeroShotTime = 0;
        startTime = performance.now();

        try {
            await processTranscript({
                text: query.text,
                sessionId: "benchmark-session",
                timestamp: Date.now(),
                context: "Previous context if needed"
            });
            const end = performance.now();
            const fullDuration = end - startTime;
            const zeroShotDuration = zeroShotTime > 0 ? (zeroShotTime - startTime) : undefined;

            results.push({ type: query.type, fullDuration, zeroShotDuration });
            console.log(`-> ✅ Final: ${fullDuration.toFixed(2)}ms`);
        } catch (error) {
            console.log(`-> ❌ Failed`);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    console.log = originalLog; // Restore

    // Report
    console.log('\n📝 Phase 3 Results:');
    results.forEach(r => {
        let msg = `${r.type}: Final ${r.fullDuration.toFixed(2)}ms`;
        if (r.zeroShotDuration) {
            msg += ` | ⚡ Zero-Shot: ${r.zeroShotDuration.toFixed(2)}ms`;
        }
        console.log(msg);
    });

    // Save report
    const reportVal = results.map(r =>
        `| ${r.type} | ${r.fullDuration.toFixed(2)}ms | ${r.zeroShotDuration ? r.zeroShotDuration.toFixed(2) + 'ms' : 'N/A'} |`
    ).join('\n');

    const reportMd = `
# ⚡ Phase 3: Zero-Shot Latency Report
**Date:** ${new Date().toISOString()}

| Query Type | Verified Latency (LLM) | Zero-Shot Latency (Regex) |
| :--- | :--- | :--- |
${reportVal}
`;
    fs.writeFileSync('latency_report_phase3.md', reportMd);
    console.log('\n📄 Report saved to latency_report_phase3.md');
}

run();
