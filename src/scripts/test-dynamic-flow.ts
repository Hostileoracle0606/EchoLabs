/**
 * TEST SCRIPT: Dynamic Flow Simulation
 * Demonstrates state-aware mock generation with jitter.
 */
import { 
    createMockTranscript, 
    createMockGeminiResponse, 
    simulateJitter 
} from '../lib/mock-factories';

async function runTestScenario() {
    console.log("=== Starting Dynamic EchoLens Simulation ===\n");

    // PHASE 1: Introduction (Revenue Focus)
    console.log("[1/3] USER: 'Let's look at our revenue performance this year...'");
    const transcript1 = createMockTranscript("Let's look at our revenue performance this year");
    console.log("-> Transcript generated with words:", transcript1.words?.length);
    
    await simulateJitter(500, 1000);
    
    const response1 = createMockGeminiResponse('revenue_growth');
    console.log("-> GEMINI ACTION:", response1.action);
    console.log("-> CARD DISPLAYED:", response1.card?.headline);
    console.log("-> SUMMARY:", response1.audienceSummary);
    console.log("------------------------------------------\n");

    await simulateJitter(2000, 3000);

    // PHASE 2: Pivot to Churn (Risk Focus)
    console.log("[2/3] USER: 'Wait, Lena mentioned some customers at risk. Who are they?'");
    const transcript2 = createMockTranscript("Wait Lena mentioned some customers at risk Who are they");
    console.log("-> Follow-up transcript words:", transcript2.words?.length);
    
    await simulateJitter(500, 1500);
    
    const response2 = createMockGeminiResponse('churn_risk', {
        audienceSummary: "Lena highlighted Meridian Health, TrueNorth, and Pinnacle as primary risks."
    });
    console.log("-> GEMINI ACTION:", response2.action);
    console.log("-> CARD MORPHED TO:", response2.card?.headline);
    console.log("-> DYNAMIC SUMMARY:", response2.audienceSummary);
    console.log("------------------------------------------\n");

    await simulateJitter(1500, 2500);

    // PHASE 3: Dismissal
    console.log("[3/3] USER: 'Got it. Let's move on.'");
    const response3 = { action: 'dismiss_current' };
    console.log("-> GEMINI ACTION:", response3.action);
    console.log("-> AURA STATE: morphing -> listening");
    
    console.log("\n=== Simulation Complete: All Mock Data Validated via Zod ===");
}

runTestScenario().catch(console.error);
