import { AppContext } from '../../libs/context';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import {
  VoteResultEntity,
  resolveVoteResult,
} from '../../entities/vote/vote-result';
import {
  VotingSessionStatus,
  votingSessionStatusOf,
} from '../../entities/votingSession/voting-session-status';
import {
  requireTeamMember,
  requireVotingSessionInTeam,
} from '../shared/authorization';

/**
 * The verdict of a voting session, or null while there is nothing to announce.
 *
 * Results stay sealed until the session closes. An open vote that already
 * showed its standings would stop being a vote: latecomers would pile onto the
 * player in front, and the reveal is the whole point of the third half.
 */
export const getVoteResult = async (
  ctx: AppContext,
  votingSession: VotingSessionEntity,
): Promise<VoteResultEntity | null> => {
  if (votingSessionStatusOf(votingSession) !== VotingSessionStatus.COMPLETED) {
    return null;
  }

  // The session arrives here as a resolver parent, so it has not necessarily
  // been through an authorization check on this path: re-assert the tenant
  // boundary rather than trusting how the caller reached it.
  const { teamId } = await requireTeamMember(ctx);
  await requireVotingSessionInTeam(ctx, votingSession.id, teamId);

  const tallies = await ctx.repositories.vote.tallyByVotingSessionId(
    votingSession.id,
  );

  return resolveVoteResult(tallies);
};
