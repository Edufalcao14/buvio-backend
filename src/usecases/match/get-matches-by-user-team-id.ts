import { AppContext } from '../../libs/context';
import { MatchEntity } from '../../entities/match/match';
import { GetMatchesByTeamIdInputEntity } from '../../entities/match/get-matches-by-team-id-input';
import Joi from 'joi';
import { requireTeamMember } from '../shared/authorization';
import { assertValid } from '../shared/validation';

const schema = Joi.object<GetMatchesByTeamIdInputEntity>({
  limit: Joi.number().integer().min(1).max(100).optional().allow(null),
  offset: Joi.number().integer().min(0).optional().allow(null),
});

export const getMatchesByUserTeamId = async (
  ctx: AppContext,
  input?: GetMatchesByTeamIdInputEntity,
): Promise<MatchEntity[]> => {
  if (input) {
    assertValid(schema, input);
  }

  const { teamId } = await requireTeamMember(ctx);

  return ctx.repositories.match.getMatchesByTeamId(
    teamId,
    input?.limit ?? undefined,
    input?.offset ?? undefined,
  );
};
