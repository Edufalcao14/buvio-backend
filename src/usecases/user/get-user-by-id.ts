import { AppContext } from '../../libs/context';
import { UserEntity } from '../../entities/user/user';
import { NotFoundError } from '../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireActiveUser } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

/**
 * Reachable from many field resolvers (Team.creator, Vote.voter, Vote.voted,
 * VotingSession.startedBy, User.team), so the tenant check belongs here rather
 * than at the entry points: a single unguarded caller would otherwise expose
 * every user record by id.
 */
export const getUserById = async (
  ctx: AppContext,
  id: string,
): Promise<UserEntity> => {
  assertValidUuid(id, 'id');

  const caller = await requireActiveUser(ctx);

  if (caller.id === id) {
    return caller;
  }

  const user = await ctx.repositories.user.getById(id);

  if (!caller.teamId || user.teamId !== caller.teamId) {
    // Same code as an unknown id: whether the user exists must not leak.
    throw new NotFoundError(ErrorMessageCode.USER_NOT_FOUND);
  }

  return user;
};
