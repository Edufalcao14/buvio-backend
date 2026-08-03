import { AppContext } from '../../libs/context';
import { MatchEntity } from '../../entities/match/match';
import { GetMatchesByTeamIdInputEntity } from '../../entities/match/get-matches-by-team-id-input';
import { ForbiddenError } from '../../entities/errors/forbidden-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireTeamMember } from '../shared/authorization';
import { assertValidUuid } from '../shared/validation';

/**
 * Matches of an explicitly named team, used by the Team.matches field resolver.
 *
 * The team has to be the caller's own: the resolver used to ignore its parent
 * and return the caller's matches for any Team object, which is a wrong-tenant
 * answer waiting to become a leak.
 */
export const getMatchesByTeamId = async (
  ctx: AppContext,
  teamId: string,
  input?: GetMatchesByTeamIdInputEntity,
): Promise<MatchEntity[]> => {
  assertValidUuid(teamId, 'teamId');

  const { teamId: callerTeamId } = await requireTeamMember(ctx);

  if (teamId !== callerTeamId) {
    throw new ForbiddenError(ErrorMessageCode.TEAM_ACCESS_DENIED);
  }

  return ctx.repositories.match.getMatchesByTeamId(
    teamId,
    input?.limit ?? undefined,
    input?.offset ?? undefined,
  );
};
