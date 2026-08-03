import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user';
import { DB } from '../models';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { toUserEntity } from './mapper/user';
import { toDatabaseError } from '../errors';

export function initGetUsersByIdsRepository(db: Kysely<DB>) {
  return async (
    ids: readonly string[],
  ): Promise<(UserEntity | NotFoundError)[]> => {
    try {
      const users = await db
        .selectFrom('users')
        .selectAll()
        .where('users.deleted_at', 'is', null)
        .where('users.id', 'in', ids)
        .execute();

      return ids.map((id) => {
        const user = users.find((user) => user.id === id);
        if (!user) {
          return new NotFoundError(ErrorMessageCode.USER_NOT_FOUND);
        }
        return toUserEntity(user);
      });
    } catch (err) {
      throw toDatabaseError(err, 'user.getByIds');
    }
  };
}
