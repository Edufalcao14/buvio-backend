import { Kysely } from 'kysely';
import { DB } from '../models';
import { toVotingSessionEntity } from './mapper/votingSession';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';
import { toDatabaseError } from '../errors';

export function initGetVotingSessionsByMatchIdsRepository(db: Kysely<DB>) {
  return async (
    matchIds: readonly string[],
  ): Promise<(VotingSessionEntity | null)[]> => {
    try {
      const votingSessions = await db
        .selectFrom('voting_sessions')
        .selectAll()
        .where('voting_sessions.deleted_at', 'is', null)
        .where('voting_sessions.match_id', 'in', matchIds)
        .execute();

      const sessionByMatchId = new Map(
        votingSessions.map((session) => [
          session.match_id,
          toVotingSessionEntity(session),
        ]),
      );

      return matchIds.map((matchId) => sessionByMatchId.get(matchId) ?? null);
    } catch (err) {
      throw toDatabaseError(err, 'votingSession.getByMatchIds');
    }
  };
}
