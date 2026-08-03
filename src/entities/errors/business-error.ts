import { ErrorCode } from './error-code';
import { ErrorMessageCode } from './error-message-code';

/**
 * `message` is set to the errorCode on purpose: the API contract is the code,
 * not prose. Anything a human needs to read belongs in the server logs (via
 * `stack`) or in the client's own translation table.
 *
 * `details` is returned to the client, so it must stay free of user data —
 * field names and constraint names only, never emails or ids of other users.
 */
export class BusinessError extends Error {
  code: ErrorCode;
  errorCode: ErrorMessageCode;
  status: number;
  details: Record<string, unknown> | undefined;

  constructor(
    errorCode: ErrorMessageCode,
    code: ErrorCode,
    status: number = 500,
    details?: Record<string, unknown>,
    stack?: string,
  ) {
    super(errorCode);
    this.name = this.constructor.name;
    this.code = code;
    this.errorCode = errorCode;
    this.status = status;
    this.details = details;
    if (stack) {
      this.stack = stack;
    }
  }
}
