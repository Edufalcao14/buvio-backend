import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user/user';
import { DB } from '../models';
import { toUserEntity } from './mapper/user';
import { toDatabaseError } from '../errors';

export function initGetUserByEmailRepository(db: Kysely<DB>) {
  return async (email: string): Promise<UserEntity | null> => {
    try {
      const user = await db
        .selectFrom('users')
        .selectAll()
        .where('users.deleted_at', 'is', null)
        .where('users.email', '=', email)
        .executeTakeFirst();
      return user ? toUserEntity(user) : null;
    } catch (err) {
      throw toDatabaseError(err, 'user.getByEmail');
    }
  };
}
