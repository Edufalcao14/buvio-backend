import { Usecases } from '../../../usecases';
import { AppContext } from '../../../libs/context';
import { SubscriptionResolvers } from '../../__generated__/resolvers-types';
import { VotingSessionEvent } from '../../../libs/events';

export const initVotingSessionSubscriptionResolvers = (
  usecases: Usecases,
): Pick<SubscriptionResolvers, 'votingSessionUpdated'> => ({
  votingSessionUpdated: {
    // Authorization happens once, when the socket subscribes: a caller who
    // cannot read the session cannot listen to it either. Every later event on
    // that stream is for a session this subscriber was already cleared for.
    subscribe: async (_, args, context: AppContext) => {
      await usecases.sessionVote.getById(context, args.votingSessionId);

      return context.events.subscribeToVotingSession(args.votingSessionId);
    },
    resolve: (payload: VotingSessionEvent) => payload.votingSession,
  },
});
