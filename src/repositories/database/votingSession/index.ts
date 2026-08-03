import { Kysely } from 'kysely';
import { DB } from '../models';
import { initGetVotingSessionByMatchIdRepository } from './get-session-by-match-id';
import { initGetVotingSessionsByMatchIdsRepository } from './get-session-by-match-ids';
import { initCreateVotingSessionRepository } from './create-voting-session';
import { initGetVotingSessionByIdRepository } from './get-session-by-id';
import DataLoader from 'dataloader';
import { initGetVotingSessionByIdsRepository } from './get-session-by-ids';
import { initCloseVotingSessionRepository } from './close-voting-session';
import { initListOverdueOpenVotingSessionsRepository } from './list-overdue-open';
import { initGetVotingSessionFreshRepository } from './get-session-fresh';

export const initVotingSessionRepositories = (db: Kysely<DB>) => {
  const dataloaderByIds = new DataLoader(
    initGetVotingSessionByIdsRepository(db),
  );
  const dataloaderByMatchIds = new DataLoader(
    initGetVotingSessionsByMatchIdsRepository(db),
  );

  return {
    getByMatchId: initGetVotingSessionByMatchIdRepository(
      db,
      dataloaderByMatchIds,
    ),
    create: initCreateVotingSessionRepository(db),
    getById: initGetVotingSessionByIdRepository(db, dataloaderByIds),
    close: initCloseVotingSessionRepository(db),
    getByIdFresh: initGetVotingSessionFreshRepository(db),
    listOverdueOpen: initListOverdueOpenVotingSessionsRepository(db),
  };
};

export type votingSessionRepositories = ReturnType<
  typeof initVotingSessionRepositories
>;
