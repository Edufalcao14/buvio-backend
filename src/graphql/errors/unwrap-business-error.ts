import { unwrapResolverError } from '@apollo/server/errors';
import { BusinessError } from '../../entities/errors/business-error';

/**
 * Finds the BusinessError behind whatever Apollo hands us, or null.
 *
 * `unwrapResolverError` only unwraps failures raised during resolver
 * execution. Errors thrown from the context function — which is where token
 * validation happens — arrive wrapped in a GraphQLError instead, so they need
 * the `originalError` chain to be followed as well. Missing that turned every
 * expired or invalid token into a 500 INTERNAL_ERROR, which clients cannot act
 * on: a token refresh needs to recognise an auth failure.
 */
export const unwrapBusinessError = (error: unknown): BusinessError | null => {
  let current: unknown = unwrapResolverError(error);

  // Bounded: a wrapping chain is a handful of links, never a cycle worth
  // chasing indefinitely.
  for (let depth = 0; current && depth < 5; depth++) {
    if (current instanceof BusinessError) {
      return current;
    }
    current = (current as { originalError?: unknown }).originalError;
  }

  return null;
};
