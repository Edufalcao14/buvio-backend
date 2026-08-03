import { Kysely } from 'kysely';
import { DB, MatchType } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { toMatchEntity } from './mapper/match';
import { MatchEntity } from '../../../entities/match/match';
import { TransactionContext } from '../transactions';
import { toDatabaseError } from '../errors';

export function initCreateMatchRepository(db: Kysely<DB>) {
  return async (
    name: string,
    date: Date,
    type: MatchType,
    creatorId: string,
    teamId: string,
    trx?: TransactionContext,
  ): Promise<MatchEntity> => {
    try {
      const query = (trx || db)
        .insertInto('matches')
        .values({
          id: uuidv4(),
          name: name,
          date: date,
          type: type,
          created_by: creatorId,
          team_id: teamId,
        })
        .returningAll();

      const newMatch = await query.executeTakeFirstOrThrow();

      return toMatchEntity(newMatch);
    } catch (err) {
      throw toDatabaseError(err, 'match.create');
    }
  };
}
