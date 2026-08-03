import { BusinessError } from './business-error';
import { ErrorCode } from './error-code';
import { ErrorMessageCode } from './error-message-code';

/**
 * Always reported to clients as INTERNAL_ERROR. `operation` names the failing
 * call site for the logs only — it never goes over the wire.
 */
export class UnknownError extends BusinessError {
  readonly operation: string | undefined;

  constructor(operation?: string, stack?: string) {
    super(
      ErrorMessageCode.INTERNAL_ERROR,
      ErrorCode.UNKNOWN,
      500,
      undefined,
      stack,
    );
    this.name = this.constructor.name;
    this.operation = operation;
  }
}
