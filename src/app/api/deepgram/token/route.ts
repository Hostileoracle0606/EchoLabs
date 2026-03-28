import { NextResponse } from 'next/server';
import { createClient } from '@deepgram/sdk';
import { requireViewer } from '@/server/foundation/auth';
import { resolveWorkspaceProviderSecret } from '@/server/foundation/providers';

const TOKEN_TTL_MS = 10 * 60 * 1000;

export async function GET() {
  let viewer;
  try {
    viewer = await requireViewer();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = resolveWorkspaceProviderSecret(viewer.workspace.id, 'deepgram', 'DEEPGRAM_API_KEY');
  const projectId = process.env.DEEPGRAM_PROJECT_ID;

  if (!apiKey) {
    return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 });
  }

  if (!projectId) {
    return NextResponse.json(
      { error: 'Deepgram project ID not configured for browser token minting' },
      { status: 500 }
    );
  }

  try {
    const deepgram = createClient(apiKey);
    const { result } = await deepgram.manage.createProjectKey(
      projectId,
      {
        comment: 'EchoLens temporary browser token',
        scopes: ['usage:write'],
        time_to_live_in_seconds: TOKEN_TTL_MS / 1000,
      }
    );

    if (!result?.key) {
      return NextResponse.json(
        { error: 'Deepgram did not return a temporary browser token' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token: result.key,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    });
  } catch (error) {
    console.error('[Deepgram Token] Failed to mint browser token', error);
    return NextResponse.json(
      { error: 'Failed to mint a temporary Deepgram browser token' },
      { status: 502 }
    );
  }
}
