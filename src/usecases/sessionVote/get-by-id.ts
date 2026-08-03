import { AppContext } from '../../libs/context';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import {
  requireTeamMember,
  requireVotingSessionInTeam,
} from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

export const getVotingSessionById = async (
  ctx: AppContext,
  votingSessionId: string,
): Promise<VotingSessionEntity> => {
  assertValidUuid(votingSessionId, 'votingSessionId');

  const { teamId } = await requireTeamMember(ctx);
  const { votingSession } = await requireVotingSessionInTeam(
    ctx,
    votingSessionId,
    teamId,
  );

  return votingSession;
};
