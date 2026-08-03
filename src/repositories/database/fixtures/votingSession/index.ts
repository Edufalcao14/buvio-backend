import { faker } from '@faker-js/faker';
import { Insertable } from 'kysely';
import { VotingSessions } from '../../models';

export const dbVotingSessionFixtures = {
  create: (
    votingSession: Partial<Insertable<VotingSessions>> & {
      match_id: string;
      started_by: string;
    },
  ): Insertable<VotingSessions> => {
    return {
      id: faker.string.uuid(),
      closing_at: null,
      ...votingSession,
    };
  },
};
