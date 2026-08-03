import { Kysely } from 'kysely';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { TeamEntity } from '../../../entities/team/team';

export function initGetTeamByIdRepository(
  db: Kysely<DB>,
  dataloaderByIds: DataLoader<string, TeamEntity | NotFoundError>,
) {
  return async (id: string): Promise<TeamEntity> => {
    const user = await dataloaderByIds.load(id);
    if (user instanceof NotFoundError) {
      throw user;
    }
    return user;
  };
}
