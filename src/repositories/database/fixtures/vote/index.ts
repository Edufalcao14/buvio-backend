import { faker } from '@faker-js/faker';
import { Insertable } from 'kysely';
import { Votes } from '../../models';

export const dbVoteFixtures = {
  create: (
    vote: Partial<Insertable<Votes>> & {
      voting_session_id: string;
      created_by: string;
      voted_for_user_id: string;
    },
  ): Insertable<Votes> => {
    return {
      id: faker.string.uuid(),
      type: 'TOP',
      description: faker.lorem.sentence(),
      ...vote,
    };
  },
};
