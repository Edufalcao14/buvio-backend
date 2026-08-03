import { Kysely } from 'kysely';
import { DB } from '../models';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { toTeamEntity } from './mapper/team';
import { TeamEntity } from '../../../entities/team/team';
import { toDatabaseError } from '../errors';

export function initGetTeamsByIdsRepository(db: Kysely<DB>) {
  return async (
    ids: readonly string[],
  ): Promise<(TeamEntity | NotFoundError)[]> => {
    try {
      const teams = await db
        .selectFrom('teams')
        .selectAll()
        .where('teams.deleted_at', 'is', null)
        .where('teams.id', 'in', ids)
        .execute();

      return ids.map((id) => {
        const team = teams.find((team) => team.id === id);
        if (!team) {
          return new NotFoundError(ErrorMessageCode.TEAM_NOT_FOUND);
        }
        return toTeamEntity(team);
      });
    } catch (err) {
      throw toDatabaseError(err, 'team.getByIds');
    }
  };
}
