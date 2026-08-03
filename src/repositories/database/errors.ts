import { BusinessError } from '../../entities/errors/business-error';
import { UnknownError } from '../../entities/errors/unknown-error';

const POSTGRES_UNIQUE_VIOLATION = '23505';

export const isUniqueViolation = (err: unknown): boolean =>
  typeof err === 'object' &&
  err !== null &&
  (err as { code?: unknown }).code === POSTGRES_UNIQUE_VIOLATION;

/**
 * Normalises a driver failure into a business error.
 *
 * Driver messages name tables, columns and constraints, so they must never
 * reach an API consumer: the client only ever sees INTERNAL_ERROR. `operation`
 * identifies the call site and the original stack is kept, both for the logs.
 *
 * Business errors raised inside a repository pass through untouched.
 */
export const toDatabaseError = (
  err: unknown,
  operation: string,
): BusinessError => {
  if (err instanceof BusinessError) {
    return err;
  }

  return new UnknownError(
    operation,
    err instanceof Error ? err.stack : undefined,
  );
};
