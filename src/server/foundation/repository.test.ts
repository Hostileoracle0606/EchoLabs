import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createOrResumeSession,
  getSessionViewer,
  getWorkspaceProviderSecret,
  listUserWorkspaces,
  listWorkspaceCredentials,
  upsertWorkspaceCredential,
} from './repository';

describe('foundation repository', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'echolens-foundation-'));
    vi.stubEnv('ECHOLENS_DATA_FILE', path.join(tempDir, 'store.json'));
    vi.stubEnv('APP_ENCRYPTION_KEY', 'test-encryption-secret');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('creates a server-side user, workspace, and session', () => {
    const viewer = createOrResumeSession({
      email: 'alex@example.com',
      name: 'Alex',
      workspaceName: 'Board Review',
    });

    expect(viewer.user.email).toBe('alex@example.com');
    expect(viewer.workspace.name).toBe('Board Review');

    const hydratedViewer = getSessionViewer(viewer.session.id);
    expect(hydratedViewer?.workspace.id).toBe(viewer.workspace.id);
    expect(listUserWorkspaces(viewer.user.id)).toHaveLength(1);
  });

  it('stores provider credentials encrypted and resolves plaintext only on access', () => {
    const viewer = createOrResumeSession({
      email: 'alex@example.com',
      name: 'Alex',
      workspaceName: 'Board Review',
    });

    upsertWorkspaceCredential({
      workspaceId: viewer.workspace.id,
      provider: 'gemini',
      secret: 'super-secret-key',
      label: 'Gemini BYOK',
    });

    const credentials = listWorkspaceCredentials(viewer.workspace.id);
    expect(credentials).toHaveLength(1);
    expect(credentials[0].label).toBe('Gemini BYOK');
    expect(getWorkspaceProviderSecret(viewer.workspace.id, 'gemini')).toBe('super-secret-key');
  });
});
