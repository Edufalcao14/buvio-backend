import { ApolloServerPlugin } from '@apollo/server';
import Logger from 'bunyan';
import { AppContext } from '../../libs/context';
import { UnknownError } from '../../entities/errors/unknown-error';
import { unwrapBusinessError } from './unwrap-business-error';

/**
 * Everything the formatter strips from the response is kept here: the failing
 * operation, the stack, and the coarse category. This is the only place the
 * internal detail of a failure exists.
 */
export const errorLoggingPlugin = (
  logger: Logger,
): ApolloServerPlugin<AppContext> => {
  return {
    requestDidStart: async () => {
      return {
        didEncounterErrors: async (rc) => {
          rc.errors.forEach((error) => {
            const businessError = unwrapBusinessError(error);

            if (businessError) {
              logger.error(
                {
                  errorCode: businessError.errorCode,
                  code: businessError.code,
                  status: businessError.status,
                  operation:
                    businessError instanceof UnknownError
                      ? businessError.operation
                      : undefined,
                  path: error.path,
                  stack: businessError.stack,
                },
                `GraphQL error ${businessError.errorCode}`,
              );
              return;
            }

            logger.error(error);
          });
        },
      };
    },
  };
};
