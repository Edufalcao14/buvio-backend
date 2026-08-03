import { Kysely } from 'kysely';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { initGetVoteByIdsRepository } from './get-by-ids';
import { initCreateVoteRepository } from './create';
import { initGetVoteByIdRepository } from './get-by-id';
import { initGetVoteByUserIdAndVotingSessionRepository } from './get-by-user-id-type-and-voting-session-id';
import { initListVotesByUserAndVotingSessionRepository } from './list-by-user-and-voting-session';
import { initTallyVotesByVotingSessionIdsRepository } from './tally-by-voting-session-ids';
import { initTallyClosedVotesByTeamIdRepository } from './tally-closed-by-team-id';
import { initListVotesByVotingSessionRepository } from './list-by-voting-session';

export const initVoteRepositories = (db: Kysely<DB>) => {
  const dataloaderByIds = new DataLoader(initGetVoteByIdsRepository(db));
  const dataloaderTalliesBySessionIds = new DataLoader(
    initTallyVotesByVotingSessionIdsRepository(db),
  );
  return {
    create: initCreateVoteRepository(db),
    getById: initGetVoteByIdRepository(db, dataloaderByIds),
    getByUserAndVotingSession:
      initGetVoteByUserIdAndVotingSessionRepository(db),
    listByUserAndVotingSession:
      initListVotesByUserAndVotingSessionRepository(db),
    tallyByVotingSessionId: (votingSessionId: string) =>
      dataloaderTalliesBySessionIds.load(votingSessionId),
    tallyClosedByTeamId: initTallyClosedVotesByTeamIdRepository(db),
    listByVotingSession: initListVotesByVotingSessionRepository(db),
  };
};

export type voteRepositories = ReturnType<typeof initVoteRepositories>;
