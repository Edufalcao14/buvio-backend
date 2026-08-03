import { Kysely } from 'kysely';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { MatchEntity } from '../../../entities/match/match';
import { toMatchEntity } from './mapper/match';
import { toDatabaseError } from '../errors';

export function initGetMatchesByTeamIdRepository(
  db: Kysely<DB>,
  dataloaderByTeamIds: DataLoader<string, MatchEntity[]>,
) {
  return async (
    teamId: string,
    limit?: number,
    offset?: number,
  ): Promise<MatchEntity[]> => {
    // Unpaginated reads go through the loader so sibling teams batch into one
    // query. A paginated read cannot: batching and LIMIT/OFFSET don't compose,
    // and slicing a fully loaded list in memory is not pagination.
    if (limit === undefined && offset === undefined) {
      return dataloaderByTeamIds.load(teamId);
    }

    try {
      let query = db
        .selectFrom('matches')
        .selectAll()
        .where('matches.deleted_at', 'is', null)
        .where('matches.team_id', '=', teamId)
        .orderBy('matches.date', 'desc')
        .orderBy('matches.id', 'desc');

      if (limit !== undefined) {
        query = query.limit(limit);
      }
      if (offset !== undefined) {
        query = query.offset(offset);
      }

      const matches = await query.execute();
      return matches.map(toMatchEntity);
    } catch (err) {
      throw toDatabaseError(err, 'match.getByTeamId');
    }
  };
}
