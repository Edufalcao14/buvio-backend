import { BusinessError } from './business-error';
import { ErrorCode } from './error-code';
import { ErrorMessageCode } from './error-message-code';

export class NotFoundError extends BusinessError {
  constructor(
    errorCode: ErrorMessageCode,
    details?: Record<string, unknown>,
    stack?: string,
  ) {
    super(errorCode, ErrorCode.NOT_FOUND, 404, details, stack);
    this.name = this.constructor.name;
  }
}
