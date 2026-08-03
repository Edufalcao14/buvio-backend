import { Usecases } from '../../../usecases';
import { AuthTokensResolvers } from '../../__generated__/resolvers-types';

export const initAuthTokensResolver = (
  usecases: Usecases,
): AuthTokensResolvers => ({
  accessToken: (parent) => {
    return parent.accessToken;
  },
  refreshToken: (parent) => {
    return parent.refreshToken;
  },
  expiredAt: (parent) => {
    return parent.expiredAt;
  },
});
