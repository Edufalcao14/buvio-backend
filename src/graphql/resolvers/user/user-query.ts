import { UserEntity } from '../../../entities/user/user';
import { Usecases } from '../../../usecases';
import { QueryResolvers } from '../../__generated__/resolvers-types';

export const initUserQueryResolvers = (
  usecases: Usecases,
): Pick<QueryResolvers, 'isEmailTaken'> => {
  return {
    isEmailTaken: async (_, args, context): Promise<boolean> => {
      return usecases.user.isEmailTaken(context, args.email);
    },
  };
};
