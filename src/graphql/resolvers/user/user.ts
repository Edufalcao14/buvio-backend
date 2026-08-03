import { Usecases } from '../../../usecases';
import { UserResolvers } from '../../__generated__/resolvers-types';
import { imageUrlOrNull } from '../image-url';

export const initUserResolvers = (usecases: Usecases): UserResolvers => ({
  id: (parent) => {
    return parent.id;
  },
  createdAt: (parent) => {
    return parent.createdAt;
  },
  updatedAt: (parent) => {
    return parent.updatedAt;
  },
  email: (parent) => {
    return parent.email;
  },
  displayName: (parent) => {
    return parent.displayName;
  },
  // Served raw, without the display-name fallback: only the client knows
  // whether it is drawing a social surface (where a nickname rules) or a
  // profile screen (where an unset nickname must read as unset).
  nickname: (parent) => {
    return parent.nickname;
  },
  avatarUrl: (parent, _, context) => {
    return imageUrlOrNull(context, parent.avatarKey);
  },
  // Authorized by the parent user, not by the request context: this field is
  // part of the signIn and createUser payloads, which are resolved before the
  // client has a token.
  team: async (parent, _, context) => {
    return await usecases.team.getOfUser(context, parent);
  },
});
