import { readFile } from 'fs/promises';

export type PolicyDocumentKind = 'agent' | 'identity' | 'prompt' | 'client' | 'rules';

export interface PolicyDocument {
  kind: PolicyDocumentKind;
  content: string;
  updatedAt: number;
  source?: string;
}

export async function ingestPolicyFromText(kind: PolicyDocumentKind, content: string): Promise<PolicyDocument> {
  return {
    kind,
    content: content.trim(),
    updatedAt: Date.now(),
  };
}

export async function ingestPolicyFromFile(kind: PolicyDocumentKind, path: string): Promise<PolicyDocument> {
  const content = await readFile(path, 'utf-8');
  return {
    kind,
    content: content.trim(),
    updatedAt: Date.now(),
    source: path,
  };
}

export interface PolicyBundle {
  agent?: PolicyDocument;
  identity?: PolicyDocument;
  prompt?: PolicyDocument;
  client?: PolicyDocument;
  rules?: PolicyDocument;
}

export function buildPolicyBundle(docs: PolicyDocument[]): PolicyBundle {
  const bundle: PolicyBundle = {};
  for (const doc of docs) {
    bundle[doc.kind] = doc;
  }
  return bundle;
}
