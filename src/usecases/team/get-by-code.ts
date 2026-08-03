import { NotFoundError } from '../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { TeamEntity } from '../../entities/team/team';
import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { requireActiveUser } from '../shared/authorization';
import { assertValid } from '../shared/validation';

const schema = Joi.object({
  code: Joi.string().trim().length(5).alphanum().required(),
});

export const getTeamByCode = async (
  ctx: AppContext,
  code: string,
): Promise<TeamEntity> => {
  assertValid(schema, { code });
  await requireActiveUser(ctx);

  const existingTeam = await ctx.repositories.team.getByCode(code);

  if (!existingTeam) {
    throw new NotFoundError(ErrorMessageCode.TEAM_CODE_NOT_FOUND);
  }

  return existingTeam;
};
