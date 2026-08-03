import { AppContext } from '../../libs/context';
import { UserEntity } from '../../entities/user/user';
import { MatchEntity } from '../../entities/match/match';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import { UnauthorizedError } from '../../entities/errors/unauthorized-error';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { NotFoundError } from '../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';

/**
 * Resolves the caller from the auth context and refuses deactivated accounts.
 * Every authenticated usecase must go through this instead of reading
 * `ctx.auth.externalId` directly, so a soft-deleted user with a still valid
 * token cannot keep writing.
 */
export const requireActiveUser = async (
  ctx: AppContext,
): Promise<UserEntity> => {
  if (!ctx.auth.isAuthenticated) {
    throw new UnauthorizedError(ErrorMessageCode.AUTH_REQUIRED);
  }

  const user = await ctx.repositories.user.getByExternalId(ctx.auth.externalId);

  if (!user) {
    throw new UnauthorizedError(ErrorMessageCode.AUTH_REQUIRED);
  }

  if (user.deletedAt !== null) {
    throw new UnauthorizedError(ErrorMessageCode.AUTH_ACCOUNT_DISABLED);
  }

  return user;
};

export type TeamMember = {
  user: UserEntity;
  teamId: string;
};

/**
 * Same as requireActiveUser, plus the guarantee that the caller belongs to a
 * team. The returned teamId is the tenant boundary every team-scoped usecase
 * must filter on.
 */
export const requireTeamMember = async (
  ctx: AppContext,
): Promise<TeamMember> => {
  const user = await requireActiveUser(ctx);

  if (!user.teamId) {
    throw new BadUserInputError(ErrorMessageCode.USER_NOT_IN_TEAM);
  }

  return { user, teamId: user.teamId };
};

/**
 * Loads a match and asserts it belongs to `teamId`.
 *
 * A match owned by another team is reported exactly like a missing one, so the
 * error cannot be used to probe which match ids exist.
 */
export const requireMatchInTeam = async (
  ctx: AppContext,
  matchId: string,
  teamId: string,
): Promise<MatchEntity> => {
  const match = await loadOrNull(ctx.repositories.match.getById(matchId));

  if (!match || match.teamId !== teamId) {
    throw new NotFoundError(ErrorMessageCode.MATCH_NOT_FOUND);
  }

  return match;
};

/**
 * Loads a voting session by id and asserts its match belongs to `teamId`.
 * Returns the session together with its match so callers do not re-query.
 */
export const requireVotingSessionInTeam = async (
  ctx: AppContext,
  votingSessionId: string,
  teamId: string,
): Promise<{ votingSession: VotingSessionEntity; match: MatchEntity }> => {
  const votingSession = await loadOrNull(
    ctx.repositories.votingSession.getById(votingSessionId),
  );

  if (!votingSession) {
    throw new NotFoundError(ErrorMessageCode.VOTING_SESSION_NOT_FOUND);
  }

  const match = await loadOrNull(
    ctx.repositories.match.getById(votingSession.matchId),
  );

  if (!match || match.teamId !== teamId) {
    // Deliberately the same code as a missing session: a session belonging to
    // another team must be indistinguishable from one that does not exist.
    throw new NotFoundError(ErrorMessageCode.VOTING_SESSION_NOT_FOUND);
  }

  return { votingSession, match };
};

/**
 * The by-id repositories reject with NotFoundError (they are dataloader
 * backed). Authorization checks want "absent" and "forbidden" to collapse into
 * one branch, so normalise the rejection into null.
 */
const loadOrNull = async <T>(promise: Promise<T>): Promise<T | null> => {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  }
};
