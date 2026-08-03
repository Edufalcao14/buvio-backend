import { AppContext } from '../../../libs/context';
import { Usecases } from '../../../usecases';
import {
  MutationCreateVotingSessionArgs,
  MutationResolvers,
} from '../../__generated__/resolvers-types';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';

export const initVotingSessionMutationResolvers = (
  usecases: Usecases,
): Pick<MutationResolvers, 'createVotingSession' | 'closeVotingSession'> => {
  return {
    createVotingSession: async (
      _,
      args: MutationCreateVotingSessionArgs,
      context: AppContext,
    ): Promise<VotingSessionEntity> => {
      return await usecases.sessionVote.create(context, {
        matchId: args.matchId,
        closingAt: args.closingAt,
      });
    },
    closeVotingSession: async (
      _,
      args,
      context: AppContext,
    ): Promise<VotingSessionEntity> => {
      return await usecases.sessionVote.close(context, args.votingSessionId);
    },
  };
};
