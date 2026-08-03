import { VoteType } from './vote-type';

export type VoteEntity = {
  id: string;
  votingSessionId: string;
  createdBy: string;
  votedForUserId: string;
  type: VoteType;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
