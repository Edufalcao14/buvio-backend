import { Kysely } from 'kysely';
import { DB } from '../models';
import { TeamEntity } from '../../../entities/team/team';
import DataLoader from 'dataloader';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { toDatabaseError } from '../errors';

export function initUpdateTeamRepository(
  db: Kysely<DB>,
  dataloaderByIds: DataLoader<string, TeamEntity | NotFoundError>,
) {
  return async (team: TeamEntity): Promise<void> => {
    try {
      // Column names in a SET clause must not be table-qualified: Postgres
      // reads `teams.code` as a column literally named "teams".
      await db
        .updateTable('teams')
        .set({
          code: team.code,
          sport: team.sport ? team.sport : null,
          name: team.name,
          crest_key: team.crestKey,
          updated_at: team.updatedAt,
        })
        .where('teams.id', '=', team.id)
        .execute();

      dataloaderByIds.clear(team.id);
    } catch (err) {
      throw toDatabaseError(err, 'team.update');
    }
  };
}
