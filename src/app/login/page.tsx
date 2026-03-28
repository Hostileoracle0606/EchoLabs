'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          workspaceName: workspaceName || undefined,
        }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to sign in');
      }

      router.push('/app');
      router.refresh();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-6 py-12 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-12 lg:flex-row lg:items-center">
        <section className="flex-1">
          <p className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-400">Phase 1 Foundation</p>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-white">
            Create a real workspace session before EchoLens starts handling provider keys.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Sessions now live on the server, workspaces own provider credentials, and browser clients
            only receive short-lived Deepgram tokens.
          </p>
        </section>

        <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Avery Chen"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="workspaceName">
                Workspace Name
              </label>
              <input
                id="workspaceName"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-white/30"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Board Review"
              />
            </div>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating workspace...' : 'Enter EchoLens'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
