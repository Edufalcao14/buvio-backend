import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { assertValid } from '../shared/validation';

const schema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .trim(),
});

/**
 * Deliberately unauthenticated: the signup form needs it before a user exists.
 * That makes it an enumeration endpoint, so it is only as safe as the rate
 * limiter in front of /graphql.
 */
export const isEmailTaken = async (
  ctx: AppContext,
  email: string,
): Promise<boolean> => {
  assertValid(schema, { email });

  const existingUser = await ctx.repositories.user.getByEmail(email);

  return existingUser !== null;
};
