export type WorkspaceRole = 'owner' | 'member';

export type ProviderType = 'deepgram' | 'gemini';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  slug: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMembershipRecord {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface AuthSessionRecord {
  id: string;
  userId: string;
  activeWorkspaceId: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderCredentialRecord {
  id: string;
  workspaceId: string;
  provider: ProviderType;
  label: string;
  encryptedSecret: string;
  iv: string;
  authTag: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface ConnectorConnectionRecord {
  id: string;
  workspaceId: string;
  provider: string;
  status: 'connected' | 'disconnected';
  createdAt: string;
  updatedAt: string;
}

export interface SourceRecord {
  id: string;
  workspaceId: string;
  connectorId: string;
  connectorType: string;
  sourceType: 'email' | 'doc' | 'calendar' | 'slack' | 'transcript';
  externalId: string;
  title: string;
  ownerLabel?: string;
  url?: string;
  syncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceChunkRecord {
  id: string;
  sourceId: string;
  workspaceId: string;
  content: string;
  preview: string;
  keywords: string[];
  createdAt: string;
}

export interface FoundationStore {
  users: UserRecord[];
  workspaces: WorkspaceRecord[];
  memberships: WorkspaceMembershipRecord[];
  sessions: AuthSessionRecord[];
  providerCredentials: ProviderCredentialRecord[];
  connectorConnections: ConnectorConnectionRecord[];
  sources: SourceRecord[];
  sourceChunks: SourceChunkRecord[];
}

export interface AuthViewer {
  user: UserRecord;
  workspace: WorkspaceRecord;
  membership: WorkspaceMembershipRecord;
  session: AuthSessionRecord;
}

export interface SafeProviderCredential {
  id: string;
  workspaceId: string;
  provider: ProviderType;
  label: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export interface SourceProvenance {
  sourceId: string;
  connectorId: string;
  connectorType: string;
  syncedAt: string;
}
