/**
 * Migration: Add schemaVersion, speaker, and callId to legacy transcript records.
 * TODO: Replace mock logic with actual PostgreSQL migration when DB is wired.
 */

import { getPostgresClient } from '@/services/storage/postgres';

async function run() {
  const db = getPostgresClient();
  await db.connect();

  // TODO: Query legacy transcripts table and backfill fields.
  // Example:
  // const records = await db.query('SELECT id, session_id, text FROM transcripts WHERE schema_version IS NULL');
  // for (const record of records) {
  //   await db.query('UPDATE transcripts SET schema_version = 2, speaker = $1, call_id = $2 WHERE id = $3', [
  //     'customer',
  //     `call-${record.session_id}`,
  //     record.id,
  //   ]);
  // }

  await db.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
