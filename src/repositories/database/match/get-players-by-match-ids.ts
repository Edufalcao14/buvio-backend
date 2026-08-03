import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user/user';
import { DB } from '../models';
import { toUserEntity } from '../user/mapper/user';
import { toDatabaseError } from '../errors';

export function initGetPlayersByMatchIdsRepository(db: Kysely<DB>) {
  return async (matchIds: readonly string[]): Promise<UserEntity[][]> => {
    try {
      const rows = await db
        .selectFrom('match_users')
        .innerJoin('users', 'users.id', 'match_users.user_id')
        .innerJoin('matches', 'matches.id', 'match_users.match_id')
        .selectAll('users')
        .select('match_users.match_id as match_users_match_id')
        .where('match_users.match_id', 'in', matchIds)
        .where('match_users.deleted_at', 'is', null)
        .where('users.deleted_at', 'is', null)
        .where('matches.deleted_at', 'is', null)
        .execute();

      const playersByMatchId = new Map<string, UserEntity[]>();

      for (const row of rows) {
        const matchId = row.match_users_match_id;
        const players = playersByMatchId.get(matchId) ?? [];
        players.push(toUserEntity(row));
        playersByMatchId.set(matchId, players);
      }

      return matchIds.map((matchId) => playersByMatchId.get(matchId) ?? []);
    } catch (err) {
      throw toDatabaseError(err, 'match.getPlayersByMatchIds');
    }
  };
}
