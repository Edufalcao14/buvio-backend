import { BusinessError } from './business-error';
import { ErrorCode } from './error-code';
import { ErrorMessageCode } from './error-message-code';

export class BadUserInputError extends BusinessError {
  constructor(
    errorCode: ErrorMessageCode,
    details?: Record<string, unknown>,
    stack?: string,
  ) {
    super(errorCode, ErrorCode.BAD_USER_INPUT, 400, details, stack);
    this.name = this.constructor.name;
  }
}
