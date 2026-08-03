import { AppContext } from '../../libs/context';
import {
  VotingSessionStatus,
  votingSessionStatusOf,
} from '../../entities/votingSession/voting-session-status';
import { requireMatchInTeam, requireTeamMember } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

export const getVotingSessionStatusByMatchId = async (
  ctx: AppContext,
  matchId: string,
): Promise<VotingSessionStatus> => {
  assertValidUuid(matchId, 'matchId');

  const { teamId } = await requireTeamMember(ctx);
  const match = await requireMatchInTeam(ctx, matchId, teamId);

  const votingSession = await ctx.repositories.votingSession.getByMatchId(
    match.id,
  );

  if (!votingSession) {
    return VotingSessionStatus.NOT_STARTED;
  }

  return votingSessionStatusOf(votingSession);
};
