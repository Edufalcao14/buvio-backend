import { Kysely, sql } from 'kysely';

/**
 * Moves every datetime column from `timestamp` to `timestamptz`.
 *
 * `timestamp` stores no offset, so a value written by a client in UTC+2 and a
 * value written by a client in UTC mean different instants while comparing as
 * if they did not. The bug this fixes is concrete: a voting session's
 * `closing_at` was compared against `now()`, so a session that had already
 * closed still accepted votes for as long as the writer's UTC offset.
 *
 * Existing values are interpreted as UTC. That is explicit rather than relying
 * on the session's TimeZone, but it does mean rows written with a non-UTC offset
 * shift by that offset — acceptable for match dates and audit columns, and the
 * alternative (leaving comparisons wrong) is worse.
 */
const COLUMNS: Record<string, string[]> = {
  users: ['created_at', 'updated_at', 'deleted_at'],
  teams: ['created_at', 'updated_at', 'deleted_at'],
  matches: ['date', 'created_at', 'updated_at', 'deleted_at'],
  match_users: ['created_at', 'updated_at', 'deleted_at'],
  voting_sessions: ['closing_at', 'created_at', 'updated_at', 'deleted_at'],
  votes: ['created_at', 'updated_at', 'deleted_at'],
};

export async function up(db: Kysely<any>): Promise<void> {
  for (const [table, columns] of Object.entries(COLUMNS)) {
    for (const column of columns) {
      await sql`
        ALTER TABLE ${sql.ref(table)}
          ALTER COLUMN ${sql.ref(column)}
          TYPE timestamptz
          USING ${sql.ref(column)} AT TIME ZONE 'UTC'
      `.execute(db);
    }
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  for (const [table, columns] of Object.entries(COLUMNS)) {
    for (const column of columns) {
      await sql`
        ALTER TABLE ${sql.ref(table)}
          ALTER COLUMN ${sql.ref(column)}
          TYPE timestamp
          USING ${sql.ref(column)} AT TIME ZONE 'UTC'
      `.execute(db);
    }
  }
}
