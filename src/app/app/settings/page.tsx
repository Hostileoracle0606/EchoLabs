import { redirect } from 'next/navigation';
import { getViewerFromRequest } from '@/server/foundation/auth';
import { listWorkspaceCredentials, listUserWorkspaces } from '@/server/foundation/repository';
import { WorkspaceSettingsPanel } from '@/components/workspace/workspace-settings-panel';

export default async function SettingsPage() {
  const viewer = await getViewerFromRequest();

  if (!viewer) {
    redirect('/login');
  }

  const credentials = listWorkspaceCredentials(viewer.workspace.id);
  const workspaces = listUserWorkspaces(viewer.user.id).map(({ workspace, membership }) => ({
    id: workspace.id,
    name: workspace.name,
    role: membership.role,
    isActive: workspace.id === viewer.workspace.id,
  }));

  return (
    <WorkspaceSettingsPanel
      viewer={{
        userName: viewer.user.name,
        userEmail: viewer.user.email,
        workspaceName: viewer.workspace.name,
      }}
      initialCredentials={credentials}
      initialWorkspaces={workspaces}
    />
  );
}
