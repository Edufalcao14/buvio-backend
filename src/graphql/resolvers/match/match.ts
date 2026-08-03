import { Usecases } from '../../../usecases';
import { MatchResolvers } from '../../__generated__/resolvers-types';
import { mapMatchType } from './match-type';

export const initMatchResolvers = (usecases: Usecases): MatchResolvers => ({
  id: (parent) => {
    return parent.id;
  },
  name: (parent) => {
    return parent.name;
  },
  date: (parent) => {
    return parent.date;
  },
  creator: async (parent, _, context) => {
    return await usecases.user.getById(context, parent.creatorId);
  },
  team: async (parent, _, context) => {
    return await usecases.team.getById(context, parent.teamId);
  },
  type: (parent) => {
    return mapMatchType(parent.type);
  },
  updatedAt: (parent) => {
    return parent.updatedAt;
  },
  createdAt: (parent) => {
    return parent.createdAt;
  },
  deletedAt: (parent) => {
    return parent.deletedAt;
  },
  players: async (parent, _, context) => {
    return await usecases.match.getPlayersByMatchId(context, parent.id);
  },
  votingSession: async (parent, _, context) => {
    return await usecases.sessionVote.getByMatchId(context, parent.id);
  },
});
