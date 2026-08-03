import { Usecases } from '../../../usecases';
import { Resolvers } from '../../__generated__/resolvers-types';
import { initMatchResolvers } from './match';
import { initMatchMutationResolvers } from './match-mutation';
import { initMatchQueryResolvers } from './match-query';

export const initMatchModuleResolvers = (usecases: Usecases): Resolvers => {
  return {
    Query: {
      ...initMatchQueryResolvers(usecases),
    },
    Mutation: {
      ...initMatchMutationResolvers(usecases),
    },
    Match: initMatchResolvers(usecases),
  };
};
