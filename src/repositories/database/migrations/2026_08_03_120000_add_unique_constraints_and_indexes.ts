import { Kysely, sql } from 'kysely';

/**
 * Uniqueness that the application only pretended to enforce.
 *
 * Every "read, then insert if absent" check in the usecases (user email, team
 * join code, one voting session per match, one vote per category) lets two
 * concurrent requests both pass the read and both insert. These partial unique
 * indexes make the database the arbiter; the application checks stay as a
 * fast path for the common case.
 *
 * The indexes are partial (`WHERE deleted_at IS NULL`) so soft-deleted rows do
 * not keep a value reserved forever.
 *
 * On a database that already holds duplicates this migration fails, on purpose:
 * the duplicates must be reconciled by hand rather than silently dropped.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE UNIQUE INDEX users_email_unique_idx
      ON users (email)
      WHERE deleted_at IS NULL
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX users_external_id_unique_idx
      ON users (external_id)
      WHERE deleted_at IS NULL
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX teams_code_unique_idx
      ON teams (code)
      WHERE deleted_at IS NULL
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX voting_sessions_match_id_unique_idx
      ON voting_sessions (match_id)
      WHERE deleted_at IS NULL
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX votes_session_voter_type_unique_idx
      ON votes (voting_session_id, created_by, type)
      WHERE deleted_at IS NULL
  `.execute(db);

  // Foreign keys that are read on every request but were never indexed.
  await sql`CREATE INDEX users_team_id_idx ON users (team_id)`.execute(db);
  await sql`CREATE INDEX matches_team_id_idx ON matches (team_id)`.execute(db);
  await sql`CREATE INDEX match_users_match_id_idx ON match_users (match_id)`.execute(
    db,
  );
  await sql`CREATE INDEX votes_voting_session_id_idx ON votes (voting_session_id)`.execute(
    db,
  );
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS votes_voting_session_id_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS match_users_match_id_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS matches_team_id_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS users_team_id_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS votes_session_voter_type_unique_idx`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS voting_sessions_match_id_unique_idx`.execute(
    db,
  );
  await sql`DROP INDEX IF EXISTS teams_code_unique_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS users_external_id_unique_idx`.execute(db);
  await sql`DROP INDEX IF EXISTS users_email_unique_idx`.execute(db);
}
