import Joi from 'joi';
import { AppContext } from '../../libs/context';
import { AuthTokensEntity } from '../../entities/auth/auth-tokens';
import { RefreshTokenInput } from '../../entities/auth/refresh-token-input';
import { assertValid } from '../shared/validation';

const schema = Joi.object<RefreshTokenInput>({
  refreshToken: Joi.string().required(),
});

export const refreshToken = async (
  ctx: AppContext,
  input: RefreshTokenInput,
): Promise<AuthTokensEntity> => {
  assertValid(schema, input);

  return ctx.gateways.iam.refreshToken(input.refreshToken);
};
