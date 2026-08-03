import { AppContext } from '../../libs/context';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import { requireMatchInTeam, requireTeamMember } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

export const getVotingSessionByMatchId = async (
  ctx: AppContext,
  matchId: string,
): Promise<VotingSessionEntity | null> => {
  assertValidUuid(matchId, 'matchId');

  const { teamId } = await requireTeamMember(ctx);
  const match = await requireMatchInTeam(ctx, matchId, teamId);

  return ctx.repositories.votingSession.getByMatchId(match.id);
};
