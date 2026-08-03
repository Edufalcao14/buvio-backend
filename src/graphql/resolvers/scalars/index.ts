import { Resolvers } from '../../__generated__/resolvers-types';
import { initEmailScalar } from './email';
import { initDateTimeScalar } from './date-time';

export const initScalars = (): Pick<Resolvers, 'Email' | 'DateTime'> => {
  return {
    Email: initEmailScalar(),
    DateTime: initDateTimeScalar(),
  };
};
