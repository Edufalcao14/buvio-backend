import { Kysely } from 'kysely';
import { DB } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { TransactionContext } from '../transactions';
import { toDatabaseError } from '../errors';

export function initAddPlayerByMatchIdRepository(db: Kysely<DB>) {
  return async (
    playerId: string,
    matchId: string,
    trx?: TransactionContext,
  ): Promise<void> => {
    try {
      await (trx || db)
        .insertInto('match_users')
        .values({
          id: uuidv4(),
          user_id: playerId,
          match_id: matchId,
        })
        .execute();
    } catch (err) {
      throw toDatabaseError(err, 'match.addPlayer');
    }
  };
}
