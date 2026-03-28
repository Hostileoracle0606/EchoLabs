import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { clearSessionCookie, getViewerFromRequest, setSessionCookie } from '@/server/foundation/auth';
import { createOrResumeSession } from '@/server/foundation/repository';

const CreateSessionSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).optional(),
  workspaceName: z.string().trim().min(1).optional(),
});

export async function GET() {
  const viewer = await getViewerFromRequest();

  return NextResponse.json({
    viewer,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid auth payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const viewer = createOrResumeSession(parsed.data);
    const response = NextResponse.json({ viewer });
    await setSessionCookie(response, viewer.session.id);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  await clearSessionCookie(response);
  return response;
}
