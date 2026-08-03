import { Kysely } from 'kysely';
import { DB } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { toVotingSessionEntity } from './mapper/votingSession';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';
import { TransactionContext } from '../transactions';
import { isUniqueViolation, toDatabaseError } from '../errors';
import { BadUserInputError } from '../../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';

export function initCreateVotingSessionRepository(db: Kysely<DB>) {
  return async (
    matchId: string,
    closingDate: Date | null,
    userId: string,
    trx?: TransactionContext,
  ): Promise<VotingSessionEntity> => {
    try {
      const newVoteSession = await (trx || db)
        .insertInto('voting_sessions')
        .values({
          id: uuidv4(),
          match_id: matchId,
          closing_at: closingDate,
          started_by: userId,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return toVotingSessionEntity(newVoteSession);
    } catch (err) {
      // One session per match is a database constraint, so two concurrent
      // createVotingSession calls cannot both succeed.
      if (isUniqueViolation(err)) {
        throw new BadUserInputError(
          ErrorMessageCode.VOTING_SESSION_ALREADY_EXISTS,
        );
      }
      throw toDatabaseError(err, 'votingSession.create');
    }
  };
}
