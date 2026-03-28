import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { requireViewer } from '@/server/foundation/auth';
import { createWorkspaceForUser, listUserWorkspaces, switchActiveWorkspace } from '@/server/foundation/repository';

const CreateWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

const SwitchWorkspaceSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

export async function GET() {
  try {
    const viewer = await requireViewer();
    const workspaces = listUserWorkspaces(viewer.user.id).map(({ workspace, membership }) => ({
      workspace,
      membership,
      isActive: workspace.id === viewer.workspace.id,
    }));

    return NextResponse.json({ workspaces });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const viewer = await requireViewer();
    const body = await request.json();
    const switchParsed = SwitchWorkspaceSchema.safeParse(body);

    if (switchParsed.success) {
      const nextViewer = switchActiveWorkspace(viewer.session.id, switchParsed.data.workspaceId);
      if (!nextViewer) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      return NextResponse.json({ viewer: nextViewer });
    }

    const parsed = CreateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid workspace payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const workspace = createWorkspaceForUser(viewer.user, parsed.data.name);
    const nextViewer = switchActiveWorkspace(viewer.session.id, workspace.id);

    return NextResponse.json({
      workspace,
      viewer: nextViewer,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
