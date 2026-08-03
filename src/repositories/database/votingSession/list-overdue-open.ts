import { Kysely } from 'kysely';
import { DB } from '../models';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';
import { toVotingSessionEntity } from './mapper/votingSession';
import { toDatabaseError } from '../errors';

/**
 * Sessions that are still open although their deadline has passed — the
 * sweeper's work list. Backed by a partial index on exactly this shape.
 */
export function initListOverdueOpenVotingSessionsRepository(db: Kysely<DB>) {
  return async (now: Date, limit = 100): Promise<VotingSessionEntity[]> => {
    try {
      const sessions = await db
        .selectFrom('voting_sessions')
        .selectAll()
        .where('voting_sessions.closed_at', 'is', null)
        .where('voting_sessions.deleted_at', 'is', null)
        .where('voting_sessions.closing_at', 'is not', null)
        .where('voting_sessions.closing_at', '<=', now)
        .orderBy('voting_sessions.closing_at', 'asc')
        .limit(limit)
        .execute();

      return sessions.map(toVotingSessionEntity);
    } catch (err) {
      throw toDatabaseError(err, 'votingSession.listOverdueOpen');
    }
  };
}
