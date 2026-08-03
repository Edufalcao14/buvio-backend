import { Usecases } from '../../../usecases';
import { QueryResolvers } from '../../__generated__/resolvers-types';

export const initVoteQueryResolvers = (
  usecases: Usecases,
): Pick<QueryResolvers, 'userHasVoted'> => {
  return {
    userHasVoted: async (_, args, context): Promise<boolean> => {
      return await usecases.vote.hasUserVoted(context, {
        creatorId: args.playerId,
        votingSessionId: args.votingSessionId,
      });
    },
  };
};
