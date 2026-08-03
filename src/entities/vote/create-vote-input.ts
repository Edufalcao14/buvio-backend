import { VoteType } from './vote-type';

export type CreateVoteInputEntity = {
  votingSessionId: string;
  votedForUserId: string;
  type: VoteType;
  description?: string | null;
};
