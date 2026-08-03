import { AppContext } from '../../libs/context';
import { TeamEntity } from '../../entities/team/team';
import { UserEntity } from '../../entities/user/user';

/**
 * The team a given user belongs to, authorized by that user rather than by the
 * request context.
 *
 * Every path that can hand a `User` to a caller is already scoped: the auth
 * payload returns the caller themselves, `getUserById` only resolves the caller
 * or a teammate, and `getTeamMembers` / `Match.players` only ever return the
 * caller's own team. So `user.teamId` is either the caller's own team or the
 * caller's own record, and re-deriving authorization from `ctx` adds nothing.
 *
 * It also actively breaks things: `signIn` and `createUser` return
 * `user { team }` *before* the client holds a token, so a ctx-based check
 * rejects the very response that issues the token.
 */
export const getTeamOfUser = async (
  ctx: AppContext,
  user: Pick<UserEntity, 'teamId'>,
): Promise<TeamEntity | null> => {
  if (!user.teamId) {
    return null;
  }

  return ctx.repositories.team.getById(user.teamId);
};
