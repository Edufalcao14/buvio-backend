import { Kysely } from 'kysely';
import { DB } from '../models';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';
import { toVotingSessionEntity } from './mapper/votingSession';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { toDatabaseError } from '../errors';

/**
 * Reads a session straight from the database, past the dataloader cache.
 *
 * The cached read is right for everything that only looks. It is wrong right
 * after a write that lost a race: the loader would hand back the copy it took
 * before the row changed, so a caller that just failed to close a session
 * would be told it is still open.
 */
export function initGetVotingSessionFreshRepository(db: Kysely<DB>) {
  return async (id: string): Promise<VotingSessionEntity> => {
    try {
      const session = await db
        .selectFrom('voting_sessions')
        .selectAll()
        .where('voting_sessions.id', '=', id)
        .where('voting_sessions.deleted_at', 'is', null)
        .executeTakeFirst();

      if (!session) {
        throw new NotFoundError(ErrorMessageCode.VOTING_SESSION_NOT_FOUND);
      }

      return toVotingSessionEntity(session);
    } catch (err) {
      if (err instanceof NotFoundError) {
        throw err;
      }
      throw toDatabaseError(err, 'votingSession.getByIdFresh');
    }
  };
}
