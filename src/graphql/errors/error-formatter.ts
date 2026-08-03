import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { ErrorCode } from '../../entities/errors/error-code';
import { GraphQLFormattedError } from 'graphql';
import { unwrapBusinessError } from './unwrap-business-error';

/**
 * The wire contract for errors.
 *
 * Clients read `extensions.errorCode` (a stable ErrorMessageCode) and render
 * their own localized copy; `message` carries the same code, never prose.
 * `extensions.details` is limited to what the error explicitly declared as
 * client-safe — field and constraint names.
 *
 * Note that failures raised while building the request context (token
 * validation) carry no `path`, unlike resolver failures.
 */
export const errorFormatter = (
  formattedError: GraphQLFormattedError,
  error: unknown,
): GraphQLFormattedError => {
  const businessError = unwrapBusinessError(error);

  if (businessError) {
    return respond(
      formattedError,
      businessError.errorCode,
      businessError.code,
      businessError.status,
      businessError.details,
    );
  }

  // Refusals from the parse/validate phase, before any resolver runs. These are
  // plain GraphQLErrors, so without this branch a query that merely exceeded the
  // depth ceiling would be reported as a 500 server fault.
  if (formattedError.extensions?.buvioErrorCode === 'QUERY_TOO_COMPLEX') {
    return respond(
      formattedError,
      ErrorMessageCode.QUERY_TOO_COMPLEX,
      ErrorCode.BAD_REQUEST,
      400,
    );
  }

  switch (formattedError.extensions?.code) {
    case 'GRAPHQL_PARSE_FAILED':
    case 'GRAPHQL_VALIDATION_FAILED':
    case 'BAD_USER_INPUT':
      return respond(
        formattedError,
        ErrorMessageCode.REQUEST_INVALID,
        ErrorCode.BAD_REQUEST,
        400,
      );
  }

  // Anything else is an unhandled failure: reporting it verbatim would leak
  // driver text, file paths and stack traces.
  return respond(
    formattedError,
    ErrorMessageCode.INTERNAL_ERROR,
    ErrorCode.UNKNOWN,
    500,
  );
};

const respond = (
  formattedError: GraphQLFormattedError,
  errorCode: ErrorMessageCode,
  code: ErrorCode,
  status: number,
  details?: Record<string, unknown>,
): GraphQLFormattedError => ({
  message: errorCode,
  path: formattedError.path,
  locations: formattedError.locations,
  extensions: {
    code,
    errorCode,
    status,
    ...(details ? { details } : {}),
  },
});
