import { Kysely } from 'kysely';
import { DB } from '../models';
import { toVoteEntity } from './mapper/vote';
import { VoteEntity } from '../../../entities/vote/vote';
import { toDatabaseError } from '../errors';

/**
 * Every vote cast in one session, oldest first.
 *
 * Feeds both the unanimity check and the full ballot list a closed session
 * shows, so it returns whole votes rather than counts.
 */
export function initListVotesByVotingSessionRepository(db: Kysely<DB>) {
  return async (votingSessionId: string): Promise<VoteEntity[]> => {
    try {
      const votes = await db
        .selectFrom('votes')
        .selectAll()
        .where('votes.deleted_at', 'is', null)
        .where('votes.voting_session_id', '=', votingSessionId)
        .orderBy('votes.created_at', 'asc')
        .execute();

      return votes.map(toVoteEntity);
    } catch (err) {
      throw toDatabaseError(err, 'vote.listByVotingSession');
    }
  };
}
