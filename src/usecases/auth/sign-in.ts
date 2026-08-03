import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { SignInInput } from '../../entities/auth/sign-in-input';
import { AuthPayload } from '../../entities/user/auth-payload';
import { UnauthorizedError } from '../../entities/errors/unauthorized-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { assertValid } from '../shared/validation';
import { authenticateRequestAs } from '../shared/authenticate-request';

const schema = Joi.object<SignInInput>({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().required(),
});

export const signIn = async (
  ctx: AppContext,
  input: SignInInput,
): Promise<AuthPayload> => {
  assertValid(schema, input);

  // The identity provider is asked first, and every failure below reports the
  // same AUTH_INVALID_CREDENTIALS. Checking our own table first (and returning
  // a distinct "not found") turned sign-in into an account-existence oracle.
  const tokens = await ctx.gateways.iam.signIn(input.email, input.password);

  const user = await ctx.repositories.user.getByEmail(input.email);

  if (!user) {
    throw new UnauthorizedError(ErrorMessageCode.AUTH_INVALID_CREDENTIALS);
  }

  if (user.deletedAt !== null) {
    throw new UnauthorizedError(ErrorMessageCode.AUTH_ACCOUNT_DISABLED);
  }

  // The payload's own nested fields (user -> team -> creator) resolve on this
  // same request, which carries no token yet.
  authenticateRequestAs(ctx, user);

  return {
    refreshToken: tokens.refreshToken,
    accessToken: tokens.accessToken,
    user: user,
  };
};
