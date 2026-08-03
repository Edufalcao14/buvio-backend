import Joi from 'joi';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';

/**
 * Validates a value and reports failures as VALIDATION_FAILED carrying the
 * offending field and the constraint it broke.
 *
 * Clients localize from `details.field` + `details.rule`, which is why the
 * schemas below carry no custom messages: prose in a Joi schema would be
 * backend-owned copy in a language the client may not want.
 */
export const assertValid = (schema: Joi.Schema, value: unknown): void => {
  const { error } = schema.validate(value, { abortEarly: true });

  if (!error) {
    return;
  }

  const [detail] = error.details;

  throw new BadUserInputError(ErrorMessageCode.VALIDATION_FAILED, {
    field: detail?.path.join('.') || undefined,
    rule: detail?.type,
  });
};

export const uuidSchema = Joi.string().uuid().required();

export const assertValidUuid = (value: unknown, field: string): void => {
  const { error } = uuidSchema.validate(value);

  if (error) {
    throw new BadUserInputError(ErrorMessageCode.VALIDATION_FAILED, {
      field,
      rule: error.details[0]?.type,
    });
  }
};
