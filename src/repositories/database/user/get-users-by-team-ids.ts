import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user';
import { DB } from '../models';
import { toUserEntity } from './mapper/user';
import { toDatabaseError } from '../errors';

export function initGetUsersByTeamIdsRepository(db: Kysely<DB>) {
  return async (teamIds: readonly string[]): Promise<UserEntity[][]> => {
    try {
      const users = await db
        .selectFrom('users')
        .selectAll()
        .where('users.deleted_at', 'is', null)
        .where('users.team_id', 'in', teamIds)
        .execute();

      const usersByTeamId = new Map<string, UserEntity[]>();

      for (const user of users) {
        if (!user.team_id) {
          continue;
        }
        const teamUsers = usersByTeamId.get(user.team_id) ?? [];
        teamUsers.push(toUserEntity(user));
        usersByTeamId.set(user.team_id, teamUsers);
      }

      return teamIds.map((teamId) => usersByTeamId.get(teamId) ?? []);
    } catch (err) {
      throw toDatabaseError(err, 'user.getByTeamIds');
    }
  };
}
