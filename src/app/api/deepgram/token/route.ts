import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';

export async function GET() {
  try {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 });
    }

    const deepgram = createClient(apiKey);
    const { result } = await deepgram.manage.createProjectKey(
      // Use a placeholder project ID — Deepgram SDK handles routing
      process.env.DEEPGRAM_PROJECT_ID || 'default',
      {
        comment: 'EchoLens temporary browser token',
        scopes: ['usage:write'],
        time_to_live_in_seconds: 600, // 10 minutes
      }
    );

    return NextResponse.json({
      token: result?.key || apiKey,
      expiresAt: Date.now() + 600000,
    });
  } catch {
    // Fallback: return the API key directly (for hackathon/dev use)
    const apiKey = process.env.DEEPGRAM_API_KEY;
    return NextResponse.json({
      token: apiKey || '',
      expiresAt: Date.now() + 600000,
    });
  }
}
