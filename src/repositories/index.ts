import { DB } from './database/models';
import { Kysely } from 'kysely';
import { initUserRepositories } from './database/user';
import { initTeamRepositories } from './database/team';
import { initTransactionRepository } from './database/transactions';
import { initMatchRepositories } from './database/match';
import { initVotingSessionRepositories } from './database/votingSession';
import { initVoteRepositories } from './database/vote';

export const initRepositories = (db: Kysely<DB>) => {
  return {
    user: initUserRepositories(db),
    team: initTeamRepositories(db),
    transaction: initTransactionRepository(db),
    match: initMatchRepositories(db),
    votingSession: initVotingSessionRepositories(db),
    vote: initVoteRepositories(db),
  };
};

export type Repositories = ReturnType<typeof initRepositories>;
