import { Kysely } from 'kysely';
import { DB } from '../models';
import { TeamEntity } from '../../../entities/team/team';
import DataLoader from 'dataloader';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { toDatabaseError } from '../errors';

export function initDeleteTeamRepository(
  db: Kysely<DB>,
  dataloaderByIds: DataLoader<string, TeamEntity | NotFoundError>,
) {
  return async (team: TeamEntity): Promise<void> => {
    try {
      // Unqualified column name: see the note in update-team.ts.
      await db
        .updateTable('teams')
        .set({ deleted_at: new Date() })
        .where('teams.id', '=', team.id)
        .execute();

      dataloaderByIds.clear(team.id);
    } catch (err) {
      throw toDatabaseError(err, 'team.delete');
    }
  };
}
