import { Kysely } from 'kysely';
import { DB } from '../models';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';
import { ClosureReason } from '../../../entities/votingSession/closure-reason';
import { toVotingSessionEntity } from './mapper/votingSession';
import { toDatabaseError } from '../errors';

/**
 * Closes a session, once.
 *
 * The `closed_at IS NULL` guard is what makes this safe to call from anywhere:
 * the sweeper, the admin's mutation and the last ballot can race, and only the
 * first one wins. A caller that gets null back knows someone else closed it and
 * must not publish a second "closed" event.
 */
export function initCloseVotingSessionRepository(db: Kysely<DB>) {
  return async (
    votingSessionId: string,
    reason: ClosureReason,
    closedAt: Date,
  ): Promise<VotingSessionEntity | null> => {
    try {
      const closed = await db
        .updateTable('voting_sessions')
        .set({
          closed_at: closedAt,
          closed_reason: reason,
          updated_at: new Date(),
        })
        .where('voting_sessions.id', '=', votingSessionId)
        .where('voting_sessions.closed_at', 'is', null)
        .where('voting_sessions.deleted_at', 'is', null)
        .returningAll()
        .executeTakeFirst();

      return closed ? toVotingSessionEntity(closed) : null;
    } catch (err) {
      throw toDatabaseError(err, 'votingSession.close');
    }
  };
}
