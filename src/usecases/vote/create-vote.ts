import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { VoteType } from '../../entities/vote/vote-type';
import { CreateVoteInputEntity } from '../../entities/vote/create-vote-input';
import { VoteEntity } from '../../entities/vote/vote';
import {
  requireTeamMember,
  requireVotingSessionInTeam,
} from '../shared/authorization';
import { isBallotingUnanimous } from '../../entities/vote/ballot';
import { ClosureReason } from '../../entities/votingSession/closure-reason';
import { isVotingSessionClosed } from '../../entities/votingSession/voting-session-status';
import { assertValid } from '../shared/validation';

const schema = Joi.object<CreateVoteInputEntity>({
  votingSessionId: Joi.string().uuid().required(),
  votedForUserId: Joi.string().uuid().required(),
  type: Joi.string().valid(VoteType.TOP, VoteType.FLOP).required(),
  description: Joi.string().max(256).optional().allow(null, ''),
});

export const createVote = async (
  ctx: AppContext,
  input: CreateVoteInputEntity,
): Promise<VoteEntity> => {
  assertValid(schema, input);

  const { user: voter, teamId } = await requireTeamMember(ctx);

  // The session must belong to the voter's own team: without this check any
  // authenticated user could stuff another team's ballot, and read that team's
  // members back through the returned Vote.
  const { votingSession, match } = await requireVotingSessionInTeam(
    ctx,
    input.votingSessionId,
    teamId,
  );

  if (input.votedForUserId === voter.id) {
    throw new BadUserInputError(ErrorMessageCode.VOTE_SELF_NOT_ALLOWED);
  }

  const players = await ctx.repositories.match.getPlayersByMatchId(match.id);
  const votedPlayer = players.find(
    (player) => player.id === input.votedForUserId,
  );

  if (!votedPlayer) {
    throw new BadUserInputError(ErrorMessageCode.VOTE_PLAYER_NOT_IN_MATCH);
  }

  const existingVotes = await ctx.repositories.vote.listByUserAndVotingSession(
    voter.id,
    votingSession.id,
  );

  if (existingVotes.some((vote) => vote.type === input.type)) {
    throw new BadUserInputError(ErrorMessageCode.VOTE_ALREADY_CAST_FOR_TYPE, {
      type: input.type,
    });
  }

  if (
    existingVotes.some((vote) => vote.votedForUserId === input.votedForUserId)
  ) {
    throw new BadUserInputError(ErrorMessageCode.VOTE_SAME_PLAYER_TOP_AND_FLOP);
  }

  const vote = await ctx.repositories.vote.create(
    votingSession.id,
    voter.id,
    votedPlayer.id,
    input.description || null,
    input.type,
  );

  // The repository only inserts while the session is open, so a null result
  // means it closed between the read above and the write.
  if (!vote) {
    throw new BadUserInputError(ErrorMessageCode.VOTING_SESSION_CLOSED);
  }

  await announce(ctx, votingSession.id, match.id);

  return vote;
};

/**
 * Publishes the new tally, and closes the session first when that vote was the
 * one the squad was waiting for.
 *
 * Closing here rather than in a background check keeps the reveal tied to the
 * action that caused it: the last player to vote sees the result land.
 */
const announce = async (
  ctx: AppContext,
  votingSessionId: string,
  matchId: string,
): Promise<void> => {
  const [votes, roster] = await Promise.all([
    ctx.repositories.vote.listByVotingSession(votingSessionId),
    ctx.repositories.match.getPlayersByMatchId(matchId),
  ]);

  if (
    isBallotingUnanimous(
      roster.map((player) => player.id),
      votes,
    )
  ) {
    const closed = await ctx.repositories.votingSession.close(
      votingSessionId,
      ClosureReason.UNANIMOUS,
      new Date(),
    );

    if (closed) {
      await ctx.events.publishVotingSession(closed);
      return;
    }
  }

  const session = await ctx.repositories.votingSession.getById(votingSessionId);
  await ctx.events.publishVotingSession(session);
};
