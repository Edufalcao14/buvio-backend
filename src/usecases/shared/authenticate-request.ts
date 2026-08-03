import { AppContext } from '../../libs/context';
import { UserEntity } from '../../entities/user/user';

/**
 * Marks the current request as authenticated as `user`.
 *
 * Called by signIn and createUser once the password has been verified. Without
 * it, the fields nested in their own payload — `user { team { creator { … } } }`
 * — resolve on a request that carries no token yet and are refused, even though
 * the caller has just proved exactly this identity.
 *
 * The context object is built per request in the GraphQL context factory, so
 * this grant cannot outlive or leak into another request. It deliberately never
 * sets `isAdmin`: administrator rights come from a verified token claim, never
 * from a password check.
 */
export const authenticateRequestAs = (
  ctx: AppContext,
  user: UserEntity,
): void => {
  ctx.auth = {
    isAuthenticated: true,
    isImpersonating: false,
    isAdmin: false,
    externalId: user.externalId,
  };
};
