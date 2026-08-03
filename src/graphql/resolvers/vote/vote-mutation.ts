import { VoteEntity } from '../../../entities/vote/vote';
import { AppContext } from '../../../libs/context';
import { Usecases } from '../../../usecases';
import {
  MutationResolvers,
  MutationSubmitVoteArgs,
} from '../../__generated__/resolvers-types';
import { toEntityVoteType } from './mapper/vote-type';

export const initVoteMutationResolvers = (
  usecases: Usecases,
): Pick<MutationResolvers, 'submitVote'> => {
  return {
    submitVote: async (
      _,
      args: MutationSubmitVoteArgs,
      context: AppContext,
    ): Promise<VoteEntity> => {
      return await usecases.vote.create(context, {
        votingSessionId: args.votingSession,
        votedForUserId: args.votedUserId,
        type: toEntityVoteType(args.type),
        description: args?.description,
      });
    },
  };
};
