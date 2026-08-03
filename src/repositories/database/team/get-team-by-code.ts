import { Kysely } from 'kysely';
import { DB } from '../models';
import { toTeamEntity } from './mapper/team';
import { TeamEntity } from '../../../entities/team/team';
import { toDatabaseError } from '../errors';

export function initGetTeamByCodeRepository(db: Kysely<DB>) {
  return async (code: string): Promise<TeamEntity | null> => {
    try {
      const team = await db
        .selectFrom('teams')
        .selectAll()
        .where('teams.deleted_at', 'is', null)
        .where('teams.code', '=', code)
        .executeTakeFirst();
      return team ? toTeamEntity(team) : null;
    } catch (err) {
      throw toDatabaseError(err, 'team.getByCode');
    }
  };
}
