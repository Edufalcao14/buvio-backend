import { AppContext } from '../../libs/context';
import { TeamEntity } from '../../entities/team/team';
import { ForbiddenError } from '../../entities/errors/forbidden-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireTeamMember } from '../shared/authorization';

/**
 * The caller's team, on the condition that they are the one who created it.
 *
 * A crest is the whole squad's identity, so unlike a nickname it is not the
 * caller's to change: any member could otherwise replace the badge everyone
 * sees. Shared by signing and confirming — signing a URL a caller may never
 * confirm is a trap, so both ends apply the same rule.
 */
export const requireCrestEditor = async (
  ctx: AppContext,
): Promise<TeamEntity> => {
  const { user, teamId } = await requireTeamMember(ctx);

  const team = await ctx.repositories.team.getById(teamId);

  if (team.creatorId !== user.id) {
    throw new ForbiddenError(ErrorMessageCode.TEAM_ACCESS_DENIED);
  }

  return team;
};
