import { faker } from '@faker-js/faker';
import { Insertable } from 'kysely';
import { Teams } from '../../models';

const TEAM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const dbTeamFixtures = {
  code: (): string =>
    Array.from({ length: 5 })
      .map(() => faker.helpers.arrayElement([...TEAM_CODE_ALPHABET]))
      .join(''),

  create: (
    team: Partial<Insertable<Teams>> & { created_by: string },
  ): Insertable<Teams> => {
    return {
      id: faker.string.uuid(),
      name: faker.company.name(),
      code: dbTeamFixtures.code(),
      sport: faker.helpers.arrayElement(['football', 'basketball', null]),
      ...team,
    };
  },
};
