import { Kysely } from 'kysely';
import { DB } from '../models';
import { toMatchEntity } from './mapper/match';
import { MatchEntity } from '../../../entities/match/match';
import { toDatabaseError } from '../errors';

export function initGetMatchesByTeamIdsRepository(db: Kysely<DB>) {
  return async (teamIds: readonly string[]): Promise<MatchEntity[][]> => {
    try {
      const matches = await db
        .selectFrom('matches')
        .selectAll()
        .where('matches.deleted_at', 'is', null)
        .where('matches.team_id', 'in', teamIds)
        .orderBy('matches.date', 'desc')
        .execute();

      const matchesByTeamId = new Map<string, MatchEntity[]>();

      for (const match of matches) {
        const teamMatches = matchesByTeamId.get(match.team_id) ?? [];
        teamMatches.push(toMatchEntity(match));
        matchesByTeamId.set(match.team_id, teamMatches);
      }

      return teamIds.map((teamId) => matchesByTeamId.get(teamId) ?? []);
    } catch (err) {
      throw toDatabaseError(err, 'match.getByTeamIds');
    }
  };
}
