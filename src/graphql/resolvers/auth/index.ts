import { Usecases } from '../../../usecases';
import { Resolvers } from '../../__generated__/resolvers-types';
import { initAuthMutationResolvers } from './auth-mutation';
import { initAuthQueryResolvers } from './auth-queries';
import { initAuthTokensResolver } from './auth-tokens';
import { initMeResolvers } from './me';

export const initAuthModuleResolvers = (usecases: Usecases): Resolvers => {
  return {
    Query: {
      ...initAuthQueryResolvers(usecases),
    },
    Mutation: {
      ...initAuthMutationResolvers(usecases),
    },
    Me: initMeResolvers(usecases),
    AuthTokens: initAuthTokensResolver(usecases),
  };
};
