import { AppContext } from '../../libs/context';
import { MatchEntity } from '../../entities/match/match';
import { requireMatchInTeam, requireTeamMember } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

export const getMatchById = async (
  ctx: AppContext,
  matchId: string,
): Promise<MatchEntity> => {
  assertValidUuid(matchId, 'matchId');

  const { teamId } = await requireTeamMember(ctx);

  return requireMatchInTeam(ctx, matchId, teamId);
};
