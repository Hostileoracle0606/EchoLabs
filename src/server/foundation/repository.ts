import crypto from 'crypto';
import { decryptSecret, encryptSecret } from './crypto';
import { getStoreSnapshot, updateStore } from './store';
import type {
  AuthSessionRecord,
  AuthViewer,
  ProviderType,
  ProviderCredentialRecord,
  SafeProviderCredential,
  UserRecord,
  WorkspaceMembershipRecord,
  WorkspaceRecord,
} from './types';

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function nowIso(): string {
  return new Date().toISOString();
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'workspace';
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

function getMembership(userId: string, workspaceId: string): WorkspaceMembershipRecord | undefined {
  return getStoreSnapshot().memberships.find(
    (membership) => membership.userId === userId && membership.workspaceId === workspaceId
  );
}

function buildViewer(session: AuthSessionRecord, store = getStoreSnapshot()): AuthViewer | null {
  const user = store.users.find((entry) => entry.id === session.userId);
  const workspace = store.workspaces.find((entry) => entry.id === session.activeWorkspaceId);

  if (!user || !workspace) {
    return null;
  }

  const membership = store.memberships.find(
    (entry) => entry.userId === user.id && entry.workspaceId === workspace.id
  );

  if (!membership) {
    return null;
  }

  return { user, workspace, membership, session };
}

export function createOrResumeSession(input: {
  email: string;
  name?: string;
  workspaceName?: string;
}): AuthViewer {
  return updateStore((store) => {
    const timestamp = nowIso();
    const normalizedEmail = input.email.trim().toLowerCase();
    let user = store.users.find((entry) => entry.email === normalizedEmail);

    if (!user) {
      user = {
        id: createId('user'),
        email: normalizedEmail,
        name: input.name?.trim() || normalizedEmail.split('@')[0] || 'EchoLens User',
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      store.users.push(user);
    } else if (input.name?.trim() && input.name.trim() !== user.name) {
      user.name = input.name.trim();
      user.updatedAt = timestamp;
    }

    const memberships = store.memberships.filter((entry) => entry.userId === user.id);
    let workspace =
      (memberships[0] &&
        store.workspaces.find((entry) => entry.id === memberships[0].workspaceId)) ||
      null;

    if (!workspace) {
      const workspaceName = input.workspaceName?.trim() || `${user.name}'s Workspace`;
      const baseSlug = slugify(workspaceName);
      let slug = baseSlug;
      let suffix = 1;
      while (store.workspaces.some((entry) => entry.slug === slug)) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      workspace = {
        id: createId('ws'),
        name: workspaceName,
        slug,
        createdByUserId: user.id,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      store.workspaces.push(workspace);
      store.memberships.push({
        id: createId('membership'),
        userId: user.id,
        workspaceId: workspace.id,
        role: 'owner',
        createdAt: timestamp,
      });
    }

    const session: AuthSessionRecord = {
      id: createId('session'),
      userId: user.id,
      activeWorkspaceId: workspace.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };

    store.sessions = store.sessions.filter((entry) => entry.expiresAt > timestamp);
    store.sessions.push(session);

    const membership = store.memberships.find(
      (entry) => entry.userId === user.id && entry.workspaceId === workspace.id
    );

    if (!membership) {
      throw new Error('Failed to establish workspace membership');
    }

    return { user, workspace, membership, session };
  });
}

export function getSessionViewer(sessionId: string | undefined): AuthViewer | null {
  if (!sessionId) {
    return null;
  }

  return updateStore((store) => {
    const timestamp = nowIso();
    store.sessions = store.sessions.filter((entry) => entry.expiresAt > timestamp);
    const session = store.sessions.find((entry) => entry.id === sessionId);

    if (!session) {
      return null;
    }

    session.updatedAt = timestamp;
    return buildViewer(session, store);
  });
}

export function deleteSession(sessionId: string | undefined): void {
  if (!sessionId) {
    return;
  }

  updateStore((store) => {
    store.sessions = store.sessions.filter((entry) => entry.id !== sessionId);
  });
}

export function listUserWorkspaces(userId: string): Array<{
  workspace: WorkspaceRecord;
  membership: WorkspaceMembershipRecord;
}> {
  const store = getStoreSnapshot();
  return store.memberships
    .filter((entry) => entry.userId === userId)
    .map((membership) => ({
      membership,
      workspace: store.workspaces.find((entry) => entry.id === membership.workspaceId)!,
    }))
    .filter((entry) => Boolean(entry.workspace));
}

export function createWorkspaceForUser(user: UserRecord, name: string): WorkspaceRecord {
  return updateStore((store) => {
    const timestamp = nowIso();
    const baseSlug = slugify(name);
    let slug = baseSlug;
    let suffix = 1;
    while (store.workspaces.some((entry) => entry.slug === slug)) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const workspace: WorkspaceRecord = {
      id: createId('ws'),
      name: name.trim(),
      slug,
      createdByUserId: user.id,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    store.workspaces.push(workspace);
    store.memberships.push({
      id: createId('membership'),
      userId: user.id,
      workspaceId: workspace.id,
      role: 'owner',
      createdAt: timestamp,
    });

    return workspace;
  });
}

export function switchActiveWorkspace(sessionId: string, workspaceId: string): AuthViewer | null {
  return updateStore((store) => {
    const session = store.sessions.find((entry) => entry.id === sessionId);
    if (!session) {
      return null;
    }

    const membership = store.memberships.find(
      (entry) => entry.userId === session.userId && entry.workspaceId === workspaceId
    );
    if (!membership) {
      return null;
    }

    session.activeWorkspaceId = workspaceId;
    session.updatedAt = nowIso();
    return buildViewer(session, store);
  });
}

export function listWorkspaceCredentials(workspaceId: string): SafeProviderCredential[] {
  return getStoreSnapshot().providerCredentials
    .filter((entry) => entry.workspaceId === workspaceId)
    .map((entry) => ({
      id: entry.id,
      workspaceId: entry.workspaceId,
      provider: entry.provider,
      label: entry.label,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      lastUsedAt: entry.lastUsedAt,
    }));
}

export function upsertWorkspaceCredential(input: {
  workspaceId: string;
  provider: ProviderType;
  secret: string;
  label?: string;
}): SafeProviderCredential {
  return updateStore((store) => {
    const timestamp = nowIso();
    const encrypted = encryptSecret(input.secret.trim());
    const existing = store.providerCredentials.find(
      (entry) => entry.workspaceId === input.workspaceId && entry.provider === input.provider
    );

    if (existing) {
      existing.label = input.label?.trim() || existing.label;
      existing.encryptedSecret = encrypted.encryptedSecret;
      existing.iv = encrypted.iv;
      existing.authTag = encrypted.authTag;
      existing.updatedAt = timestamp;
      return {
        id: existing.id,
        workspaceId: existing.workspaceId,
        provider: existing.provider,
        label: existing.label,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
        lastUsedAt: existing.lastUsedAt,
      };
    }

    const record: ProviderCredentialRecord = {
      id: createId('credential'),
      workspaceId: input.workspaceId,
      provider: input.provider,
      label: input.label?.trim() || `${input.provider} key`,
      encryptedSecret: encrypted.encryptedSecret,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.providerCredentials.push(record);

    return {
      id: record.id,
      workspaceId: record.workspaceId,
      provider: record.provider,
      label: record.label,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastUsedAt: record.lastUsedAt,
    };
  });
}

export function deleteWorkspaceCredential(workspaceId: string, provider: ProviderType): void {
  updateStore((store) => {
    store.providerCredentials = store.providerCredentials.filter(
      (entry) => !(entry.workspaceId === workspaceId && entry.provider === provider)
    );
  });
}

export function getWorkspaceProviderSecret(
  workspaceId: string,
  provider: ProviderType
): string | null {
  return updateStore((store) => {
    const credential = store.providerCredentials.find(
      (entry) => entry.workspaceId === workspaceId && entry.provider === provider
    );

    if (!credential) {
      return null;
    }

    credential.lastUsedAt = nowIso();
    return decryptSecret(credential.encryptedSecret, credential.iv, credential.authTag);
  });
}

export function userHasWorkspaceAccess(userId: string, workspaceId: string): boolean {
  return Boolean(getMembership(userId, workspaceId));
}
