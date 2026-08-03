import { Usecases } from '../../../usecases';
import { Resolvers } from '../../__generated__/resolvers-types';
import { initVotingSessionResolvers } from './voting-session';
import { initVotingSessionMutationResolvers } from './voting-session-mutation';
import { initVotingSessionSubscriptionResolvers } from './voting-session-subscription';

export const initVotingSessionResolver = (usecases: Usecases): Resolvers => {
  return {
    Query: {},
    Mutation: {
      ...initVotingSessionMutationResolvers(usecases),
    },
    Subscription: {
      ...initVotingSessionSubscriptionResolvers(usecases),
    },
    VotingSession: initVotingSessionResolvers(usecases),
  };
};
