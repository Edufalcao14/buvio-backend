import { AppContext } from '../../../libs/context';
import { Usecases } from '../../../usecases';
import {
  MutationCreateMatchArgs,
  MutationResolvers,
} from '../../__generated__/resolvers-types';
import { MatchEntity } from '../../../entities/match/match';
import { toEntityMatchType } from './mapper/toMatchTypeEntity';
export const initMatchMutationResolvers = (
  usecases: Usecases,
): Pick<MutationResolvers, 'createMatch'> => {
  return {
    createMatch: async (
      _,
      args: MutationCreateMatchArgs,
      context: AppContext,
    ): Promise<MatchEntity> => {
      return await usecases.match.create(context, {
        name: args.name,
        date: args.date,
        type: toEntityMatchType(args.type),
      });
    },
  };
};
