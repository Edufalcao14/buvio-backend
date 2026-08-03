import { initUserUsecases } from './user';
import { initAuthUsecases } from './auth';
import { initTeamUsecases } from './team';
import { initMatchUsecases } from './match';
import { initSessionVoteUsecases } from './sessionVote';
import { initVoteUsecases } from './vote';

export const initUsecases = () => {
  return {
    user: initUserUsecases(),
    auth: initAuthUsecases(),
    team: initTeamUsecases(),
    match: initMatchUsecases(),
    sessionVote: initSessionVoteUsecases(),
    vote: initVoteUsecases(),
  };
};

export type Usecases = ReturnType<typeof initUsecases>;
