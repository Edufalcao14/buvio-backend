import { AuthPayload } from '../../entities/user/auth-payload';
import { CreateUserInput } from '../../entities/user/create-user-input';
import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { BadRequestError } from '../../entities/errors/bad-request-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { assertValid } from '../shared/validation';
import { authenticateRequestAs } from '../shared/authenticate-request';

const MIN_PASSWORD_LENGTH = 12;

/** Matches the varchar(40) the column was created with. */
const MAX_NICKNAME_LENGTH = 40;

const schema = Joi.object<CreateUserInput>({
  displayName: Joi.string().trim().min(1).max(255).required(),
  // Optional at sign-up: a player who skips it is known by the first word of
  // their display name until they pick one.
  nickname: Joi.string()
    .trim()
    .max(MAX_NICKNAME_LENGTH)
    .allow('', null)
    .optional(),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required(),
  password: Joi.string().min(MIN_PASSWORD_LENGTH).max(128).required(),
});

export const createUser = async (
  ctx: AppContext,
  input: CreateUserInput,
): Promise<AuthPayload> => {
  assertValid(schema, input);

  const userExist = await ctx.repositories.user.getByEmail(input.email);

  if (userExist) {
    throw new BadRequestError(ErrorMessageCode.USER_EMAIL_ALREADY_EXISTS);
  }

  const externalId = await ctx.gateways.iam.createUser(
    input.email,
    input.password,
    input.displayName,
  );

  // The identity account exists from here on, but the user row may still fail
  // (a concurrent signup losing the unique index, for instance). Without this
  // rollback the account would be orphaned: unusable and impossible to
  // re-create, because the address is already taken in the identity provider.
  let newUser;
  try {
    newUser = await ctx.repositories.user.create(
      input.email,
      input.displayName,
      externalId,
      // Blank and absent are the same thing here, and both must be stored as
      // null so socialNameOf has a single spelling of "unset" to test.
      input.nickname?.trim() || null,
    );
  } catch (error) {
    await ctx.gateways.iam.deleteUser(externalId).catch((cleanupError) => {
      ctx.logger.error(
        { error: cleanupError, externalId },
        'Failed to roll back the identity account after a failed signup',
      );
    });
    throw error;
  }

  const tokens = await ctx.gateways.iam.signIn(input.email, input.password);

  // Same reason as signIn: the payload's nested fields resolve on this request,
  // which carries no token yet.
  authenticateRequestAs(ctx, newUser);

  return {
    user: newUser,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};
