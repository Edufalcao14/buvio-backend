import { MeEntity } from '../../../entities/auth/me';
import { Usecases } from '../../../usecases';
import { QueryResolvers } from '../../__generated__/resolvers-types';

export const initAuthQueryResolvers = (
  usecases: Usecases,
): Pick<QueryResolvers, 'me'> => {
  return {
    me: async (_, __, context): Promise<MeEntity> => {
      return usecases.auth.getMe(context);
    },
  };
};
