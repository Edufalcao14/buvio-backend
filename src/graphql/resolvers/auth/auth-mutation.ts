import { AppContext } from '../../../libs/context';
import { AuthTokensEntity } from '../../../entities/auth/auth-tokens';
import { Usecases } from '../../../usecases';
import {
  MutationResolvers,
  MutationSignInArgs,
  AuthPayload,
  ResolverTypeWrapper,
  MutationRefreshTokenArgs,
} from '../../__generated__/resolvers-types';
import { UserEntity } from '../../../entities/user/user';

export const initAuthMutationResolvers = (
  usecases: Usecases,
): Pick<MutationResolvers, 'signIn' | 'refreshToken'> => {
  return {
    signIn: async (
      _,
      args: MutationSignInArgs,
      context: AppContext,
    ): Promise<
      Omit<AuthPayload, 'user'> & { user: ResolverTypeWrapper<UserEntity> }
    > => {
      return await usecases.auth.signIn(context, {
        email: args.email,
        password: args.password,
      });
    },
    refreshToken: async (
      _,
      args: MutationRefreshTokenArgs,
      context: AppContext,
    ): Promise<AuthTokensEntity> => {
      return usecases.auth.refreshToken(context, {
        refreshToken: args.input.refreshToken,
      });
    },
  };
};
