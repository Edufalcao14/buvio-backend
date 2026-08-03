import { Kysely } from 'kysely';
import { DB } from '../models';
import { toVoteEntity } from './mapper/vote';
import { VoteEntity } from '../../../entities/vote/vote';
import { toDatabaseError } from '../errors';

/**
 * Every vote a user cast in one session — at most one TOP and one FLOP.
 * Callers that must reason about both need the whole set: fetching a single row
 * hides the other category.
 */
export function initListVotesByUserAndVotingSessionRepository(db: Kysely<DB>) {
  return async (
    creatorId: string,
    votingSessionId: string,
  ): Promise<VoteEntity[]> => {
    try {
      const votes = await db
        .selectFrom('votes')
        .selectAll()
        .where('votes.deleted_at', 'is', null)
        .where('votes.created_by', '=', creatorId)
        .where('votes.voting_session_id', '=', votingSessionId)
        .execute();

      return votes.map(toVoteEntity);
    } catch (err) {
      throw toDatabaseError(err, 'vote.listByUserAndVotingSession');
    }
  };
}
