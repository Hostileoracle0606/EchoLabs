import { redirect } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { getViewerFromRequest } from '@/server/foundation/auth';

export default async function Home() {
  const viewer = await getViewerFromRequest();

  if (!viewer) {
    redirect('/login');
  }

  return (
    <MainLayout
      viewer={{
        userName: viewer.user.name,
        userEmail: viewer.user.email,
        workspaceId: viewer.workspace.id,
        workspaceName: viewer.workspace.name,
      }}
    />
  );
}
