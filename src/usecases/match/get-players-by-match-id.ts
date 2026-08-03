import { AppContext } from '../../libs/context';
import { UserEntity } from '../../entities/user/user';
import { requireMatchInTeam, requireTeamMember } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

export const getPlayersByMatchId = async (
  ctx: AppContext,
  matchId: string,
): Promise<UserEntity[]> => {
  assertValidUuid(matchId, 'matchId');

  const { teamId } = await requireTeamMember(ctx);
  const match = await requireMatchInTeam(ctx, matchId, teamId);

  return ctx.repositories.match.getPlayersByMatchId(match.id);
};
