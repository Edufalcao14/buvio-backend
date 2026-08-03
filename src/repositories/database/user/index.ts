import { Kysely } from 'kysely';
import { DB } from '../models';
import { initGetUserByEmailRepository } from './get-user-by-email';
import { initCreateUserRepository } from './create-user';
import { initGetUserByExternalIdRepository } from './get-user-by-external-id';
import { initGetUserByIdRepository } from './get-user-by-id';
import DataLoader from 'dataloader';
import { initGetUsersByIdsRepository } from './get-users-by-ids';
import { initGetUsersByTeamIdsRepository } from './get-users-by-team-ids';
import { initGetUsersByTeamIdRepository } from './get-users-by-team-id';
import { initUpdateUserRepository } from './update-user';

export const initUserRepositories = (db: Kysely<DB>) => {
  const dataloaderByIds = new DataLoader(initGetUsersByIdsRepository(db));
  const dataLoaderByTeamIds = new DataLoader(
    initGetUsersByTeamIdsRepository(db),
  );
  return {
    create: initCreateUserRepository(db),
    getByEmail: initGetUserByEmailRepository(db),
    getByExternalId: initGetUserByExternalIdRepository(db),
    getById: initGetUserByIdRepository(db, dataloaderByIds),
    getUsersByTeamId: initGetUsersByTeamIdRepository(db, dataLoaderByTeamIds),
    update: initUpdateUserRepository(db, dataloaderByIds, dataLoaderByTeamIds),
  };
};

export type userRepositories = ReturnType<typeof initUserRepositories>;
