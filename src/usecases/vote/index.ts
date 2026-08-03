import { createVote } from './create-vote';
import { hasUserVoted } from './has-user-voted';
import { getVoteResult } from './get-vote-result';
import { listVotesBySession } from './list-by-session';
import { getTally } from './get-tally';

export const initVoteUsecases = () => {
  return {
    hasUserVoted: hasUserVoted,
    create: createVote,
    getResult: getVoteResult,
    listBySession: listVotesBySession,
    getTally: getTally,
  };
};

export type VoteUsecases = ReturnType<typeof initVoteUsecases>;
