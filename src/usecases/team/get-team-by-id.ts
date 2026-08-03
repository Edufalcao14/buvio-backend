import { AppContext } from '../../libs/context';
import { NotFoundError } from '../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { TeamEntity } from '../../entities/team/team';
import { requireActiveUser } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

/**
 * Only the caller's own team can be read by id. Looking up a team you are not
 * a member of goes through `teamByCode`, which is the join flow.
 */
export const getTeamById = async (
  ctx: AppContext,
  id: string,
): Promise<TeamEntity> => {
  assertValidUuid(id, 'id');

  const caller = await requireActiveUser(ctx);

  if (caller.teamId !== id) {
    throw new NotFoundError(ErrorMessageCode.TEAM_NOT_FOUND);
  }

  return ctx.repositories.team.getById(id);
};
