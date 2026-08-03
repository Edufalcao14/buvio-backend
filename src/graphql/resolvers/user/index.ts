import { Usecases } from '../../../usecases';
import { Resolvers } from '../../__generated__/resolvers-types';
import { initUserResolvers } from './user';
import { initUserMutationResolvers } from './user-mutation';
import { initUserQueryResolvers } from './user-query';

export const initUserModuleResolvers = (usecases: Usecases): Resolvers => {
  return {
    Query: {
      ...initUserQueryResolvers(usecases),
    },
    Mutation: {
      ...initUserMutationResolvers(usecases),
    },
    User: initUserResolvers(usecases),
  };
};
