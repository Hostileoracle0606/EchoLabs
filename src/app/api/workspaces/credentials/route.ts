import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { requireViewer } from '@/server/foundation/auth';
import {
  deleteWorkspaceCredential,
  listWorkspaceCredentials,
  upsertWorkspaceCredential,
} from '@/server/foundation/repository';

const ProviderSchema = z.enum(['deepgram', 'gemini']);

const UpsertCredentialSchema = z.object({
  provider: ProviderSchema,
  secret: z.string().trim().min(1),
  label: z.string().trim().max(80).optional(),
});

const DeleteCredentialSchema = z.object({
  provider: ProviderSchema,
});

export async function GET() {
  try {
    const viewer = await requireViewer();
    const credentials = listWorkspaceCredentials(viewer.workspace.id);
    return NextResponse.json({ credentials });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireViewer();

    if (viewer.membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only workspace owners can manage credentials' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpsertCredentialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid credential payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const credential = upsertWorkspaceCredential({
      workspaceId: viewer.workspace.id,
      provider: parsed.data.provider,
      secret: parsed.data.secret,
      label: parsed.data.label,
    });

    return NextResponse.json({ credential });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const viewer = await requireViewer();

    if (viewer.membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only workspace owners can manage credentials' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = DeleteCredentialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid credential payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    deleteWorkspaceCredential(viewer.workspace.id, parsed.data.provider);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
