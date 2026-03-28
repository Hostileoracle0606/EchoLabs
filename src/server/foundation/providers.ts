import { getWorkspaceProviderSecret } from './repository';
import type { ProviderType } from './types';

function allowFallbackCredentials(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_CREDENTIALS === 'true';
}

export function resolveWorkspaceProviderSecret(
  workspaceId: string,
  provider: ProviderType,
  envKey?: string
): string | null {
  const workspaceSecret = getWorkspaceProviderSecret(workspaceId, provider);
  if (workspaceSecret) {
    return workspaceSecret;
  }

  if (!envKey || !allowFallbackCredentials()) {
    return null;
  }

  return process.env[envKey] || null;
}
