import { Kysely } from 'kysely';
import { DB } from '../models';
import { initGetTeamByCodeRepository } from './get-team-by-code';
import { initCreateTeamRepository } from './create-team';
import { initGetTeamByIdRepository } from './get-team-by-id';
import DataLoader from 'dataloader';
import { initGetTeamsByIdsRepository } from './get-team-by-ids';
import { initUpdateTeamRepository } from './update-team';
import { initDeleteTeamRepository } from './delete-team';

export const initTeamRepositories = (db: Kysely<DB>) => {
  const dataloaderByIds = new DataLoader(initGetTeamsByIdsRepository(db));

  return {
    getByCode: initGetTeamByCodeRepository(db),
    create: initCreateTeamRepository(db),
    getById: initGetTeamByIdRepository(db, dataloaderByIds),
    update: initUpdateTeamRepository(db, dataloaderByIds),
    delete: initDeleteTeamRepository(db, dataloaderByIds),
  };
};

export type teamRepositories = ReturnType<typeof initTeamRepositories>;
