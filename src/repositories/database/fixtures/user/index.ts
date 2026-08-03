import { faker } from '@faker-js/faker';
import { Insertable, Selectable, Updateable } from 'kysely';
import { Users } from '../../models';

export const dbUserFixtures = {
  select: (user?: Partial<Selectable<Users>>): Selectable<Users> => {
    return {
      id: faker.string.uuid(),
      created_at: faker.date.past(),
      updated_at: faker.date.past(),
      deleted_at: null,
      external_id: faker.string.uuid(),
      email: faker.internet.email(),
      display_name: faker.person.firstName(),
      nickname: null,
      avatar_key: null,
      team_id: null,
      ...user,
    };
  },
  // team_id defaults to null: a random uuid would violate the foreign key on
  // every insert, so callers pass a real team when they want one.
  create: (user?: Partial<Insertable<Users>>): Insertable<Users> => {
    return {
      id: faker.string.uuid(),
      external_id: faker.string.uuid(),
      email: faker.internet.email(),
      display_name: faker.person.firstName(),
      nickname: null,
      avatar_key: null,
      team_id: null,
      ...user,
    };
  },
  update: (user?: Partial<Updateable<Users>>): Updateable<Users> => {
    return {
      updated_at: new Date(),
      external_id: faker.string.uuid(),
      email: faker.internet.email(),
      display_name: faker.person.firstName(),
      nickname: null,
      avatar_key: null,
      team_id: null,
      ...user,
    };
  },
};
