import { TeamEntity } from '../../../entities/team/team';
import { UserEntity } from '../../../entities/user';
import { Usecases } from '../../../usecases';
import { QueryResolvers } from '../../__generated__/resolvers-types';

export const initTeamQueryResolvers = (
  usecases: Usecases,
): Pick<
  QueryResolvers,
  'teamByCode' | 'getTeamMembers' | 'validateTeamCode' | 'teamRanking'
> => {
  return {
    teamByCode: async (_, args, context): Promise<TeamEntity> => {
      return usecases.team.getByCode(context, args.code);
    },
    getTeamMembers: async (_, args, context): Promise<UserEntity[]> => {
      return usecases.team.getMembers(context);
    },
    validateTeamCode: async (_, args, context): Promise<boolean> => {
      return await usecases.team.validateCode(context, args.code);
    },
    teamRanking: async (_, args, context) => {
      const standings = await usecases.team.getRanking(context);

      // The players are already loaded by the ranking usecase and sit in the
      // by-id dataloader, so resolving them here costs no extra query.
      return Promise.all(
        standings.map(async (standing) => ({
          player: await usecases.user.getById(context, standing.userId),
          topCount: standing.topCount,
          flopCount: standing.flopCount,
        })),
      );
    },
  };
};
