import { Usecases } from '../../usecases';
import { Resolvers } from '../__generated__/resolvers-types';
import { initScalars } from './scalars';
import { initUserModuleResolvers } from './user';
import { initAuthModuleResolvers } from './auth';
import { initTeamModuleResolvers } from './team';
import { initMatchModuleResolvers } from './match';
import { initVotingSessionResolver } from './votingSession';
import { initVoteResolver } from './vote';

export const initResolvers = (usecases: Usecases): Resolvers => {
  const {
    Query: userQueries,
    Mutation: userMutations,
    ...userResolvers
  } = initUserModuleResolvers(usecases);

  const {
    Query: authQueries,
    Mutation: authMutations,
    ...authResolvers
  } = initAuthModuleResolvers(usecases);

  const {
    Query: teamQueries,
    Mutation: teamMutations,
    ...teamResolvers
  } = initTeamModuleResolvers(usecases);

  const {
    Query: matchQueries,
    Mutation: matchMutations,
    ...matchResolvers
  } = initMatchModuleResolvers(usecases);

  const {
    Query: votingSessionQueries,
    Mutation: votingSessionMutations,
    ...votingSessionResolvers
  } = initVotingSessionResolver(usecases);

  const {
    Query: voteQueries,
    Mutation: voteMutations,
    ...voteResolvers
  } = initVoteResolver(usecases);
  return {
    ...initScalars(),
    Query: {
      ...userQueries,
      ...authQueries,
      ...teamQueries,
      ...matchQueries,
      ...votingSessionQueries,
      ...voteQueries,
    },
    Mutation: {
      ...userMutations,
      ...authMutations,
      ...teamMutations,
      ...matchMutations,
      ...votingSessionMutations,
      ...voteMutations,
    },
    ...userResolvers,
    ...authResolvers,
    ...teamResolvers,
    ...matchResolvers,
    ...votingSessionResolvers,
    ...voteResolvers,
  };
};
