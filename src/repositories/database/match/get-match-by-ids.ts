import { Kysely } from 'kysely';
import { DB } from '../models';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { toMatchEntity } from './mapper/match';
import { MatchEntity } from '../../../entities/match/match';
import { toDatabaseError } from '../errors';

export function initGetMatchesByIdsRepository(db: Kysely<DB>) {
  return async (
    ids: readonly string[],
  ): Promise<(MatchEntity | NotFoundError)[]> => {
    try {
      const matches = await db
        .selectFrom('matches')
        .selectAll()
        .where('matches.deleted_at', 'is', null)
        .where('matches.id', 'in', ids)
        .execute();

      return ids.map((id) => {
        const match = matches.find((match) => match.id === id);
        if (!match) {
          return new NotFoundError(ErrorMessageCode.MATCH_NOT_FOUND);
        }
        return toMatchEntity(match);
      });
    } catch (err) {
      throw toDatabaseError(err, 'match.getByIds');
    }
  };
}
