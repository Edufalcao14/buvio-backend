import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { requireActiveUser } from '../shared/authorization';
import { assertValid } from '../shared/validation';

const schema = Joi.object({
  code: Joi.string().trim().length(5).alphanum().required(),
});

export const validateCode = async (
  ctx: AppContext,
  code: string,
): Promise<boolean> => {
  assertValid(schema, { code });
  await requireActiveUser(ctx);

  const existingTeam = await ctx.repositories.team.getByCode(code);

  return existingTeam !== null;
};
