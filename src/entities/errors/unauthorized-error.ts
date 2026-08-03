import { BusinessError } from './business-error';
import { ErrorCode } from './error-code';
import { ErrorMessageCode } from './error-message-code';

export class UnauthorizedError extends BusinessError {
  constructor(
    errorCode: ErrorMessageCode,
    details?: Record<string, unknown>,
    stack?: string,
  ) {
    super(errorCode, ErrorCode.UNAUTHORIZED, 401, details, stack);
    this.name = this.constructor.name;
  }
}
