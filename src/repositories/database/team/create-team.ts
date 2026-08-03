import { Kysely } from 'kysely';
import { DB } from '../models';
import { TeamEntity } from '../../../entities/team/team';
import { v4 as uuidv4 } from 'uuid';
import { toTeamEntity } from './mapper/team';
import { TransactionContext } from '../transactions';
import { isUniqueViolation, toDatabaseError } from '../errors';
import { ConflictError } from '../../../entities/errors/conflict-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';

export function initCreateTeamRepository(db: Kysely<DB>) {
  return async (
    name: string,
    code: string,
    creatorId: string,
    sport: string | null,
    trx?: TransactionContext,
  ): Promise<TeamEntity> => {
    try {
      const query = (trx || db)
        .insertInto('teams')
        .values({
          id: uuidv4(),
          name: name,
          code: code,
          created_by: creatorId,
          sport: sport,
        })
        .returningAll();

      const createTeam = await query.executeTakeFirstOrThrow();
      return toTeamEntity(createTeam);
    } catch (err) {
      // Two teams generating the same join code concurrently: the unique index
      // rejects the loser, and the caller retries with a fresh code.
      if (isUniqueViolation(err)) {
        throw new ConflictError(ErrorMessageCode.TEAM_CODE_TAKEN);
      }
      throw toDatabaseError(err, 'team.create');
    }
  };
}
