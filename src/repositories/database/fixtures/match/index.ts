import { faker } from '@faker-js/faker';
import { Insertable } from 'kysely';
import { MatchUsers, Matches } from '../../models';

export const dbMatchFixtures = {
  create: (
    match: Partial<Insertable<Matches>> & {
      created_by: string;
      team_id: string;
    },
  ): Insertable<Matches> => {
    return {
      id: faker.string.uuid(),
      name: `${faker.company.name()} vs ${faker.company.name()}`,
      date: faker.date.soon(),
      type: faker.helpers.arrayElement(['AMICAL', 'TOURNOI', 'CHAMPIONNAT']),
      ...match,
    };
  },

  createPlayer: (
    matchUser: Partial<Insertable<MatchUsers>> & {
      match_id: string;
      user_id: string;
    },
  ): Insertable<MatchUsers> => {
    return {
      id: faker.string.uuid(),
      ...matchUser,
    };
  },
};
