import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user/user';
import { DB } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { toUserEntity } from './mapper/user';
import { BadRequestError } from '../../../entities/errors/bad-request-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { isUniqueViolation, toDatabaseError } from '../errors';
import { TransactionContext } from '../transactions';

export function initCreateUserRepository(db: Kysely<DB>) {
  return async (
    email: string,
    display_name: string,
    externalId: string,
    nickname: string | null = null,
    trx?: TransactionContext,
  ): Promise<UserEntity> => {
    try {
      const createUser = await (trx || db)
        .insertInto('users')
        .values({
          id: uuidv4(),
          email: email,
          display_name: display_name,
          nickname: nickname,
          external_id: externalId,
          team_id: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return toUserEntity(createUser);
    } catch (err) {
      // The unique index is what actually settles concurrent signups for the
      // same address; the caller's pre-check only makes the common case nicer.
      if (isUniqueViolation(err)) {
        throw new BadRequestError(ErrorMessageCode.USER_EMAIL_ALREADY_EXISTS);
      }
      throw toDatabaseError(err, 'user.create');
    }
  };
}
