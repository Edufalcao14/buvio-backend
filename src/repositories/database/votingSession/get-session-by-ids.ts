import { Kysely } from 'kysely';
import { DB } from '../models';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { toVotingSessionEntity } from './mapper/votingSession';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';
import { toDatabaseError } from '../errors';

export function initGetVotingSessionByIdsRepository(db: Kysely<DB>) {
  return async (
    ids: readonly string[],
  ): Promise<(VotingSessionEntity | NotFoundError)[]> => {
    try {
      const votingSessions = await db
        .selectFrom('voting_sessions')
        .selectAll()
        .where('voting_sessions.deleted_at', 'is', null)
        .where('voting_sessions.id', 'in', ids)
        .execute();

      return ids.map((id) => {
        const votingSession = votingSessions.find(
          (votingSession) => votingSession.id === id,
        );

        // Returned, not thrown: a dataloader batch must report a miss per key,
        // otherwise one absent id fails every other key in the same batch.
        if (!votingSession) {
          return new NotFoundError(ErrorMessageCode.VOTING_SESSION_NOT_FOUND);
        }

        return toVotingSessionEntity(votingSession);
      });
    } catch (err) {
      throw toDatabaseError(err, 'votingSession.getByIds');
    }
  };
}
