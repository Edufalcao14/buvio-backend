import { Kysely } from 'kysely';
import { DB } from '../models';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { VoteEntity } from '../../../entities/vote/vote';
import { toVoteEntity } from './mapper/vote';
import { toDatabaseError } from '../errors';

export function initGetVoteByIdsRepository(db: Kysely<DB>) {
  return async (
    ids: readonly string[],
  ): Promise<(VoteEntity | NotFoundError)[]> => {
    try {
      const votes = await db
        .selectFrom('votes')
        .selectAll()
        .where('votes.deleted_at', 'is', null)
        .where('votes.id', 'in', ids)
        .execute();

      return ids.map((id) => {
        const vote = votes.find((vote) => vote.id === id);
        if (!vote) {
          return new NotFoundError(ErrorMessageCode.VOTE_NOT_FOUND);
        }
        return toVoteEntity(vote);
      });
    } catch (err) {
      throw toDatabaseError(err, 'vote.getByIds');
    }
  };
}
