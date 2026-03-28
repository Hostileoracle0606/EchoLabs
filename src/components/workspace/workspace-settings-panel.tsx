'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import type { ProviderType, SafeProviderCredential, WorkspaceRole } from '@/server/foundation/types';

interface WorkspaceSummary {
  id: string;
  name: string;
  role: WorkspaceRole;
  isActive: boolean;
}

interface WorkspaceSettingsPanelProps {
  viewer: {
    userName: string;
    userEmail: string;
    workspaceName: string;
  };
  initialCredentials: SafeProviderCredential[];
  initialWorkspaces: WorkspaceSummary[];
}

const PROVIDERS: ProviderType[] = ['deepgram', 'gemini'];

export function WorkspaceSettingsPanel({
  viewer,
  initialCredentials,
  initialWorkspaces,
}: WorkspaceSettingsPanelProps) {
  const router = useRouter();
  const [credentials, setCredentials] = useState(initialCredentials);
  const [workspaces, setWorkspaces] = useState(initialWorkspaces);
  const [workspaceName, setWorkspaceName] = useState('');
  const [providerLabel, setProviderLabel] = useState<Record<ProviderType, string>>({
    deepgram: '',
    gemini: '',
  });
  const [providerSecret, setProviderSecret] = useState<Record<ProviderType, string>>({
    deepgram: '',
    gemini: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.isActive) || null,
    [workspaces]
  );

  async function refreshWorkspaces() {
    const response = await fetch('/api/workspaces');
    const payload = (await response.json()) as { workspaces?: Array<{ workspace: WorkspaceSummary; isActive: boolean }> };
    if (payload.workspaces) {
      setWorkspaces(
        payload.workspaces.map((entry) => ({
          ...entry.workspace,
          isActive: entry.isActive,
        }))
      );
    }
  }

  async function refreshCredentials() {
    const response = await fetch('/api/workspaces/credentials');
    const payload = (await response.json()) as { credentials?: SafeProviderCredential[] };
    if (payload.credentials) {
      setCredentials(payload.credentials);
    }
  }

  async function handleWorkspaceCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: workspaceName }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error || 'Failed to create workspace');
      return;
    }

    setWorkspaceName('');
    await refreshWorkspaces();
    router.refresh();
  }

  async function handleWorkspaceSwitch(workspaceId: string) {
    setMessage(null);
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error || 'Failed to switch workspace');
      return;
    }

    await refreshWorkspaces();
    await refreshCredentials();
    router.refresh();
  }

  async function handleCredentialSubmit(provider: ProviderType, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch('/api/workspaces/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider,
        label: providerLabel[provider] || undefined,
        secret: providerSecret[provider],
      }),
    });
    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setMessage(payload.error || 'Failed to save credential');
      return;
    }

    setProviderSecret((current) => ({ ...current, [provider]: '' }));
    setProviderLabel((current) => ({ ...current, [provider]: '' }));
    await refreshCredentials();
    setMessage(`${provider} credential saved for ${activeWorkspace?.name || viewer.workspaceName}.`);
  }

  async function handleSignOut() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-12 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspace Settings</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">{viewer.workspaceName}</h1>
            <p className="mt-3 text-slate-300">
              Signed in as {viewer.userName} ({viewer.userEmail})
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/app" className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200">
              Back to Workspace
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
            >
              Sign Out
            </button>
          </div>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Provider Credentials</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Bind AI and transcription keys to this workspace</h2>
            </div>

            {PROVIDERS.map((provider) => {
              const existing = credentials.find((credential) => credential.provider === provider);
              return (
                <form key={provider} className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5" onSubmit={(event) => handleCredentialSubmit(provider, event)}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium capitalize text-white">{provider}</h3>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      {existing ? 'Configured' : 'Not set'}
                    </span>
                  </div>

                  <input
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    value={providerLabel[provider]}
                    onChange={(event) => setProviderLabel((current) => ({ ...current, [provider]: event.target.value }))}
                    placeholder={`${provider} workspace key`}
                  />
                  <textarea
                    required
                    className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                    value={providerSecret[provider]}
                    onChange={(event) => setProviderSecret((current) => ({ ...current, [provider]: event.target.value }))}
                    placeholder={`Paste the ${provider} API key for ${activeWorkspace?.name || viewer.workspaceName}`}
                  />
                  <button
                    type="submit"
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900"
                  >
                    Save {provider}
                  </button>
                </form>
              );
            })}
          </div>

          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspaces</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Switch or create a workspace</h2>
            </div>

            <div className="space-y-3">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={() => handleWorkspaceSwitch(workspace.id)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                    workspace.isActive
                      ? 'border-white/30 bg-white/10'
                      : 'border-white/10 bg-black/20 hover:border-white/20'
                  }`}
                >
                  <div>
                    <p className="font-medium text-white">{workspace.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{workspace.role}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    {workspace.isActive ? 'Active' : 'Open'}
                  </span>
                </button>
              ))}
            </div>

            <form className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-5" onSubmit={handleWorkspaceCreate}>
              <h3 className="text-lg font-medium text-white">Create another workspace</h3>
              <input
                required
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Analyst Sync"
              />
              <button type="submit" className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900">
                Create Workspace
              </button>
            </form>

            {message ? <p className="text-sm text-slate-300">{message}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
