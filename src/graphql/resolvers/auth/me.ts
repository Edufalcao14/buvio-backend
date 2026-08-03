import { Usecases } from '../../../usecases';
import { MeResolvers } from '../../__generated__/resolvers-types';
import { imageUrlOrNull } from '../image-url';

export const initMeResolvers = (usecases: Usecases): MeResolvers => ({
  id: (parent) => {
    return parent.id;
  },
  email: (parent) => {
    return parent.email;
  },
  displayName: (parent) => {
    return parent.displayName;
  },
  // Unlike User.nickname this one is the player looking at their own settings,
  // so null genuinely means "you have not chosen one" and must stay null.
  nickname: (parent) => {
    return parent.nickname;
  },
  avatarUrl: (parent, _, context) => {
    return imageUrlOrNull(context, parent.avatarKey);
  },
  team: async (parent, _, context) => {
    return await usecases.team.getOfUser(context, parent);
  },
});
