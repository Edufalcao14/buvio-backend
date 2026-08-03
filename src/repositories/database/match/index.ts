import { Kysely } from 'kysely';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { initGetMatchByIdRepository } from './get-match-by-id';
import { initGetMatchesByIdsRepository } from './get-match-by-ids';
import { initGetPlayersByMatchIdRepository } from './get-players-by-match-id';
import { initGetPlayersByMatchIdsRepository } from './get-players-by-match-ids';
import { initCreateMatchRepository } from './create-match';
import { initAddPlayerByMatchIdRepository } from './add-player-by-match-id';
import { initGetMatchesByTeamIdsRepository } from './get-matches-by-team-ids';
import { initGetMatchesByTeamIdRepository } from './get-matches-by-team-id';

export const initMatchRepositories = (db: Kysely<DB>) => {
  const dataloaderByMatchIds = new DataLoader(
    initGetMatchesByIdsRepository(db),
  );
  const dataLoaderByTeamIds = new DataLoader(
    initGetMatchesByTeamIdsRepository(db),
  );
  const dataLoaderPlayersByMatchIds = new DataLoader(
    initGetPlayersByMatchIdsRepository(db),
  );

  return {
    getById: initGetMatchByIdRepository(db, dataloaderByMatchIds),
    getMatchesByTeamId: initGetMatchesByTeamIdRepository(
      db,
      dataLoaderByTeamIds,
    ),
    getPlayersByMatchId: initGetPlayersByMatchIdRepository(
      db,
      dataLoaderPlayersByMatchIds,
    ),
    create: initCreateMatchRepository(db),
    addPlayer: initAddPlayerByMatchIdRepository(db),
  };
};

export type matchRepositories = ReturnType<typeof initMatchRepositories>;
