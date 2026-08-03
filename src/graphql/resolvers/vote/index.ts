import { Usecases } from '../../../usecases';
import { Resolvers } from '../../__generated__/resolvers-types';
import { initVoteResolvers } from './vote';
import { initVoteMutationResolvers } from './vote-mutation';
import { initVoteQueryResolvers } from './vote-query';

export const initVoteResolver = (usecases: Usecases): Resolvers => {
  return {
    Query: {
      ...initVoteQueryResolvers(usecases),
    },
    Mutation: {
      ...initVoteMutationResolvers(usecases),
    },
    Vote: initVoteResolvers(usecases),
  };
};
