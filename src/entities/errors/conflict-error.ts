import { BusinessError } from './business-error';
import { ErrorCode } from './error-code';
import { ErrorMessageCode } from './error-message-code';

/**
 * A write lost a race against a uniqueness constraint. Callers that can retry
 * with different input (a freshly generated team code, say) match on this type.
 */
export class ConflictError extends BusinessError {
  constructor(
    errorCode: ErrorMessageCode,
    details?: Record<string, unknown>,
    stack?: string,
  ) {
    super(errorCode, ErrorCode.CONFLICT, 409, details, stack);
    this.name = this.constructor.name;
  }
}
