import { Kysely } from 'kysely';
import { DB } from '../models';
import { TransactionContext } from '../transactions';
import { UserEntity } from '../../../entities/user';
import DataLoader from 'dataloader';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { toDatabaseError } from '../errors';

export function initUpdateUserRepository(
  db: Kysely<DB>,
  dataloaderByIds: DataLoader<string, UserEntity | NotFoundError>,
  dataloaderByTeamIds: DataLoader<string, UserEntity[]>,
) {
  return async (user: UserEntity, trx?: TransactionContext): Promise<void> => {
    try {
      const executor = trx || db;

      // Read the team the user is leaving so its cached member list is evicted
      // too — clearing only the new team would leave the old one stale.
      const previous = await executor
        .selectFrom('users')
        .select('team_id')
        .where('users.id', '=', user.id)
        .executeTakeFirst();

      await executor
        .updateTable('users')
        .set({
          team_id: user.teamId,
          display_name: user.displayName,
          nickname: user.nickname,
          avatar_key: user.avatarKey,
          email: user.email,
          updated_at:
            user.updatedAt instanceof Date
              ? user.updatedAt
              : new Date(user.updatedAt),
          deleted_at: user.deletedAt,
        })
        .where('users.id', '=', user.id)
        .execute();

      dataloaderByIds.clear(user.id);

      if (previous?.team_id) {
        dataloaderByTeamIds.clear(previous.team_id);
      }
      if (user.teamId !== null) {
        dataloaderByTeamIds.clear(user.teamId);
      }
    } catch (err) {
      throw toDatabaseError(err, 'user.update');
    }
  };
}
