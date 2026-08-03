import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { NotFoundError } from '../../../entities/errors/not-found-error';

export function initGetUsersByTeamIdRepository(
  db: Kysely<DB>,
  dataloaderByTeamIds: DataLoader<string, UserEntity[]>,
) {
  return async (teamId: string): Promise<UserEntity[]> => {
    return await dataloaderByTeamIds.load(teamId);
  };
}
