import { AppContext } from '../../libs/context';
import { NotFoundError } from '../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { votingSessionTimeRemaining } from '../../entities/votingSession/voting-session-status';
import { requireMatchInTeam, requireTeamMember } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

export const getVotingTimeRemaining = async (
  ctx: AppContext,
  matchId: string,
): Promise<number> => {
  assertValidUuid(matchId, 'matchId');

  const { teamId } = await requireTeamMember(ctx);
  const match = await requireMatchInTeam(ctx, matchId, teamId);

  const votingSession = await ctx.repositories.votingSession.getByMatchId(
    match.id,
  );

  if (!votingSession) {
    throw new NotFoundError(ErrorMessageCode.VOTING_SESSION_NOT_FOUND);
  }

  return votingSessionTimeRemaining(votingSession);
};
