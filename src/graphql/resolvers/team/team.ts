import { Usecases } from '../../../usecases';
import { TeamResolvers } from '../../__generated__/resolvers-types';
import { imageUrlOrNull } from '../image-url';

export const initTeamResolvers = (usecases: Usecases): TeamResolvers => ({
  id: (parent) => {
    return parent.id;
  },
  name: (parent) => {
    return parent.name;
  },
  code: (parent) => {
    return parent.code;
  },
  creator: async (parent, _, context) => {
    return await usecases.user.getById(context, parent.creatorId);
  },
  sport: (parent) => {
    return parent.sport || null;
  },
  // Null means the team has not uploaded a badge; the client draws the
  // monogram of the team's initials in its place.
  crestUrl: (parent, _, context) => {
    return imageUrlOrNull(context, parent.crestKey);
  },
  updatedAt: (parent) => {
    return parent.updatedAt;
  },
  createdAt: (parent) => {
    return parent.createdAt;
  },
  matches: async (parent, _, context) => {
    return await usecases.match.getMatchesByTeamId(context, parent.id);
  },
});
