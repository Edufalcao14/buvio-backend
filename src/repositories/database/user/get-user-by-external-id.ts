import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user/user';
import { DB } from '../models';
import { toUserEntity } from './mapper/user';
import { toDatabaseError } from '../errors';

export function initGetUserByExternalIdRepository(db: Kysely<DB>) {
  return async (externalId: string): Promise<UserEntity | null> => {
    try {
      const user = await db
        .selectFrom('users')
        .selectAll()
        .where('users.deleted_at', 'is', null)
        .where('users.external_id', '=', externalId)
        .executeTakeFirst();

      return user ? toUserEntity(user) : null;
    } catch (err) {
      throw toDatabaseError(err, 'user.getByExternalId');
    }
  };
}
