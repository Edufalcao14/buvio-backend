import { Kysely } from 'kysely';
import { DB } from '../models';
import { toVoteEntity } from './mapper/vote';
import { VoteEntity } from '../../../entities/vote/vote';
import { VoteType } from '../../../entities/vote/vote-type';
import { toDatabaseError } from '../errors';

export function initGetVoteByUserIdAndVotingSessionRepository(db: Kysely<DB>) {
  return async (
    creatorId: string,
    votingSessionId: string,
    type?: VoteType,
  ): Promise<VoteEntity | null> => {
    try {
      let query = db
        .selectFrom('votes')
        .selectAll()
        .where('votes.deleted_at', 'is', null)
        .where('votes.created_by', '=', creatorId)
        .where('votes.voting_session_id', '=', votingSessionId);

      if (type) {
        query = query.where('votes.type', '=', type);
      }

      const vote = await query.executeTakeFirst();
      return vote ? toVoteEntity(vote) : null;
    } catch (err) {
      throw toDatabaseError(err, 'vote.getByUserAndVotingSession');
    }
  };
}
