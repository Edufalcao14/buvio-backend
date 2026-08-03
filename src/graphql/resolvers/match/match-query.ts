import { MatchEntity } from '../../../entities/match/match';
import { TeamEntity } from '../../../entities/team/team';
import { Usecases } from '../../../usecases';
import { QueryResolvers } from '../../__generated__/resolvers-types';
import { GetMatchesByTeamIdInputEntity } from '../../../entities/match/get-matches-by-team-id-input';

export const initMatchQueryResolvers = (
  usecases: Usecases,
): Pick<QueryResolvers, 'getMatchById'> => {
  return {
    getMatchById: async (_, args, context): Promise<MatchEntity> => {
      return await usecases.match.getById(context, args.matchId);
    },
  };
};
