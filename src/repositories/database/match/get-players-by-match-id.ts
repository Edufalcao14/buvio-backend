import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user/user';
import { DB } from '../models';
import DataLoader from 'dataloader';

export function initGetPlayersByMatchIdRepository(
  db: Kysely<DB>,
  dataloaderByMatchIds: DataLoader<string, UserEntity[]>,
) {
  return async (matchId: string): Promise<UserEntity[]> => {
    return dataloaderByMatchIds.load(matchId);
  };
}
