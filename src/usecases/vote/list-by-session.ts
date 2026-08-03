import { AppContext } from '../../libs/context';
import { VoteEntity } from '../../entities/vote/vote';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import {
  requireTeamMember,
  requireVotingSessionInTeam,
} from '../shared/authorization';

/**
 * Every vote of a session, for the squad that played it.
 *
 * Comments are part of a vote, so this is also what the "see all votes" screen
 * reads — and why the tenant check is not optional.
 */
export const listVotesBySession = async (
  ctx: AppContext,
  votingSession: VotingSessionEntity,
): Promise<VoteEntity[]> => {
  const { teamId } = await requireTeamMember(ctx);
  await requireVotingSessionInTeam(ctx, votingSession.id, teamId);

  return ctx.repositories.vote.listByVotingSession(votingSession.id);
};
