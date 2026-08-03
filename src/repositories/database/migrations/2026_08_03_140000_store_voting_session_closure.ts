import { Kysely, sql } from 'kysely';

/**
 * Records how and when a voting session actually closed.
 *
 * `closing_at` says when a session is *scheduled* to close, which cannot
 * express the two other endings the product has: an admin closing early, or
 * every player completing their ballot. Deriving closure from `closing_at`
 * alone also leaves no single instant for clients to agree on, and the live
 * reveal needs exactly one.
 *
 * Existing sessions whose deadline has already passed are backfilled as closed
 * by DEADLINE, which is what the old derivation reported for them.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TYPE vote_closure_reason AS ENUM ('ADMIN', 'DEADLINE', 'UNANIMOUS')
  `.execute(db);

  await db.schema
    .alterTable('voting_sessions')
    .addColumn('closed_at', 'timestamptz')
    .execute();

  await sql`
    ALTER TABLE voting_sessions
      ADD COLUMN closed_reason vote_closure_reason
  `.execute(db);

  await sql`
    UPDATE voting_sessions
       SET closed_at = closing_at,
           closed_reason = 'DEADLINE'
     WHERE closing_at IS NOT NULL
       AND closing_at <= now()
       AND deleted_at IS NULL
  `.execute(db);

  // Every closed session has both columns or neither: a closure with no reason
  // is a row nothing can explain.
  await sql`
    ALTER TABLE voting_sessions
      ADD CONSTRAINT voting_sessions_closure_complete
      CHECK (
        (closed_at IS NULL AND closed_reason IS NULL)
        OR (closed_at IS NOT NULL AND closed_reason IS NOT NULL)
      )
  `.execute(db);

  // The sweeper looks for exactly this shape: still open, deadline passed.
  await sql`
    CREATE INDEX voting_sessions_open_with_deadline_idx
      ON voting_sessions (closing_at)
      WHERE closed_at IS NULL AND closing_at IS NOT NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS voting_sessions_open_with_deadline_idx`.execute(
    db,
  );
  await sql`
    ALTER TABLE voting_sessions
      DROP CONSTRAINT IF EXISTS voting_sessions_closure_complete
  `.execute(db);
  await db.schema
    .alterTable('voting_sessions')
    .dropColumn('closed_reason')
    .execute();
  await db.schema
    .alterTable('voting_sessions')
    .dropColumn('closed_at')
    .execute();
  await sql`DROP TYPE IF EXISTS vote_closure_reason`.execute(db);
}
