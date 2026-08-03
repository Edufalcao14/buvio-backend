import { Usecases } from '../../../usecases';
import { Resolvers } from '../../__generated__/resolvers-types';
import { initTeamResolvers } from './team';
import { initTeamMutationResolvers } from './team-mutation';
import { initTeamQueryResolvers } from './team-query';

export const initTeamModuleResolvers = (usecases: Usecases): Resolvers => {
  return {
    Query: {
      ...initTeamQueryResolvers(usecases),
    },
    Mutation: {
      ...initTeamMutationResolvers(usecases),
    },
    Team: initTeamResolvers(usecases),
  };
};
