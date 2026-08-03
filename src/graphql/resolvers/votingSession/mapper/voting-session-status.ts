import { VoteSessionStatus } from '../../../__generated__/resolvers-types';
import { VotingSessionStatus } from '../../../../entities/votingSession/voting-session-status';

export const toGraphQLVotingSessionStatus = (
  status: VotingSessionStatus,
): VoteSessionStatus => {
  switch (status) {
    case VotingSessionStatus.NOT_STARTED:
      return VoteSessionStatus.NotStarted;
    case VotingSessionStatus.IN_PROGRESS:
      return VoteSessionStatus.InProgress;
    case VotingSessionStatus.COMPLETED:
      return VoteSessionStatus.Completed;
  }
};
