import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { CreateVotingSessionInputEntity } from '../../entities/votingSession/create-voting-session';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import { requireMatchInTeam, requireTeamMember } from '../shared/authorization';
import { assertValid } from '../shared/validation';

const schema = Joi.object<CreateVotingSessionInputEntity>({
  matchId: Joi.string().uuid().required(),
  closingAt: Joi.date().greater('now').optional().allow(null),
});

export const createVotingSession = async (
  ctx: AppContext,
  input: CreateVotingSessionInputEntity,
): Promise<VotingSessionEntity> => {
  assertValid(schema, input);

  const { user: creator, teamId } = await requireTeamMember(ctx);
  const match = await requireMatchInTeam(ctx, input.matchId, teamId);

  // A duplicate session is rejected by the unique index on
  // voting_sessions.match_id, which the repository reports as
  // VOTING_SESSION_ALREADY_EXISTS.
  return ctx.repositories.votingSession.create(
    match.id,
    input.closingAt ?? null,
    creator.id,
  );
};
