import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { HasUserVotedInput } from '../../entities/vote/has-user-voted-input';
import {
  requireTeamMember,
  requireVotingSessionInTeam,
} from '../shared/authorization';
import { assertValid } from '../shared/validation';

const schema = Joi.object<HasUserVotedInput>({
  creatorId: Joi.string().uuid().required(),
  votingSessionId: Joi.string().uuid().required(),
});

export const hasUserVoted = async (
  ctx: AppContext,
  input: HasUserVotedInput,
): Promise<boolean> => {
  assertValid(schema, input);

  const { teamId } = await requireTeamMember(ctx);

  // Both the session and the probed user have to sit inside the caller's team,
  // otherwise this query is an existence oracle for arbitrary ids.
  const { votingSession, match } = await requireVotingSessionInTeam(
    ctx,
    input.votingSessionId,
    teamId,
  );

  const players = await ctx.repositories.match.getPlayersByMatchId(match.id);

  if (!players.some((player) => player.id === input.creatorId)) {
    throw new BadUserInputError(ErrorMessageCode.VOTE_PLAYER_NOT_IN_MATCH);
  }

  const vote = await ctx.repositories.vote.getByUserAndVotingSession(
    input.creatorId,
    votingSession.id,
  );

  return vote !== null;
};
