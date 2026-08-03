import { AppContext } from '../../libs/context';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import { ClosureReason } from '../../entities/votingSession/closure-reason';
import { ForbiddenError } from '../../entities/errors/forbidden-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import {
  requireTeamMember,
  requireVotingSessionInTeam,
} from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

/**
 * Ends a session early, on the admin's word.
 *
 * Only the player who started it may do this: everyone else closing the vote
 * whenever their own ballot is in would let one impatient teammate cut the
 * squad off.
 */
export const closeVotingSession = async (
  ctx: AppContext,
  votingSessionId: string,
): Promise<VotingSessionEntity> => {
  assertValidUuid(votingSessionId, 'votingSessionId');

  const { user, teamId } = await requireTeamMember(ctx);
  const { votingSession } = await requireVotingSessionInTeam(
    ctx,
    votingSessionId,
    teamId,
  );

  if (votingSession.startedBy !== user.id) {
    throw new ForbiddenError(ErrorMessageCode.VOTING_SESSION_NOT_ADMIN);
  }

  const closed = await ctx.repositories.votingSession.close(
    votingSession.id,
    ClosureReason.ADMIN,
    new Date(),
  );

  // Null means it was already closed — by the deadline sweeper or by the last
  // ballot landing a moment earlier. That is not an error for the caller, but
  // it must not publish a second closing event. The re-read skips the
  // dataloader, which still holds the copy taken before the close.
  if (!closed) {
    return ctx.repositories.votingSession.getByIdFresh(votingSession.id);
  }

  await ctx.events.publishVotingSession(closed);

  return closed;
};
