import { Usecases } from '../../../usecases';
import { VoteResolvers } from '../../__generated__/resolvers-types';
import { toGraphQLVoteType } from './mapper/vote-type';

export const initVoteResolvers = (usecases: Usecases): VoteResolvers => ({
  id: (parent) => {
    return parent.id;
  },
  votingSession: async (parent, _, context) => {
    return await usecases.sessionVote.getById(context, parent.votingSessionId);
  },
  voter: async (parent, _, context) => {
    return await usecases.user.getById(context, parent.createdBy);
  },
  voted: async (parent, _, context) => {
    return await usecases.user.getById(context, parent.votedForUserId);
  },
  type: (parent) => {
    return toGraphQLVoteType(parent.type);
  },
  createdAt: (parent) => {
    return parent.createdAt;
  },
  updatedAt: (parent) => {
    return parent.updatedAt;
  },
  deletedAt: (parent) => {
    return parent.deletedAt;
  },
});
