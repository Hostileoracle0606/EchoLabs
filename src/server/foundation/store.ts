import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { FoundationStore } from './types';

const DEFAULT_STORE: FoundationStore = {
  users: [],
  workspaces: [],
  memberships: [],
  sessions: [],
  providerCredentials: [],
  connectorConnections: [],
  sources: [],
  sourceChunks: [],
};

const STORE_ROW_ID = 1;
const STORE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS foundation_store (
    id INTEGER PRIMARY KEY CHECK (id = ${STORE_ROW_ID}),
    payload TEXT NOT NULL
  )
`;
const require = createRequire(import.meta.url);

interface DatabaseStatement {
  get(...params: unknown[]): unknown;
  run(...params: unknown[]): unknown;
}

interface SqliteDatabase {
  exec(sql: string): void;
  prepare(sql: string): DatabaseStatement;
  close(): void;
}

interface SqliteDatabaseConstructor {
  new (location: string): SqliteDatabase;
}

function getDatabaseConstructor(): SqliteDatabaseConstructor {
  return require('node:sqlite').DatabaseSync as SqliteDatabaseConstructor;
}

function resolveStorePath(): string {
  return process.env.ECHOLENS_DATA_FILE
    ? path.resolve(process.env.ECHOLENS_DATA_FILE)
    : path.join(process.cwd(), '.data', 'echolens-store.sqlite');
}

function ensureStoreDirectory(filePath: string): void {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

function normalizeStore(parsed?: Partial<FoundationStore> | null): FoundationStore {
  return {
    users: parsed?.users || [],
    workspaces: parsed?.workspaces || [],
    memberships: parsed?.memberships || [],
    sessions: parsed?.sessions || [],
    providerCredentials: parsed?.providerCredentials || [],
    connectorConnections: parsed?.connectorConnections || [],
    sources: parsed?.sources || [],
    sourceChunks: parsed?.sourceChunks || [],
  };
}

function readLegacyJsonStore(filePath: string): FoundationStore | null {
  if (!filePath.endsWith('.json') || !fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<FoundationStore>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

function openDatabase(): SqliteDatabase {
  const filePath = resolveStorePath();
  ensureStoreDirectory(filePath);
  const DatabaseSync = getDatabaseConstructor();
  const database = new DatabaseSync(filePath);
  database.exec(STORE_TABLE_SQL);

  const existingRow = database
    .prepare('SELECT payload FROM foundation_store WHERE id = ?')
    .get(STORE_ROW_ID) as { payload: string } | undefined;

  if (!existingRow) {
    const initialStore = readLegacyJsonStore(filePath) || structuredClone(DEFAULT_STORE);
    database
      .prepare('INSERT INTO foundation_store (id, payload) VALUES (?, ?)')
      .run(STORE_ROW_ID, JSON.stringify(initialStore));
  }

  return database;
}

function readStore(): FoundationStore {
  const database = openDatabase();
  try {
    const row = database
      .prepare('SELECT payload FROM foundation_store WHERE id = ?')
      .get(STORE_ROW_ID) as { payload: string } | undefined;

    if (!row) {
      return structuredClone(DEFAULT_STORE);
    }

    return normalizeStore(JSON.parse(row.payload) as Partial<FoundationStore>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  } finally {
    database.close();
  }
}

function writeStore(store: FoundationStore): void {
  const database = openDatabase();
  try {
    database
      .prepare('UPDATE foundation_store SET payload = ? WHERE id = ?')
      .run(JSON.stringify(store), STORE_ROW_ID);
  } finally {
    database.close();
  }
}

export function getStoreSnapshot(): FoundationStore {
  return readStore();
}

export function updateStore<T>(updater: (store: FoundationStore) => T): T {
  const store = readStore();
  const result = updater(store);
  writeStore(store);
  return result;
}
