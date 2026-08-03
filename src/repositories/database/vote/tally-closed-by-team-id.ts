import { Kysely } from 'kysely';
import { DB } from '../models';
import { VoteTallyEntity } from '../../../entities/vote/vote-tally';
import { VoteType } from '../../../entities/vote/vote-type';
import { toDatabaseError } from '../errors';

/**
 * Every vote a team's players collected across their *closed* sessions.
 *
 * Only closed sessions count, for the same reason a single result stays sealed
 * until then: a standings table fed by an open vote would leak its running
 * score.
 */
export function initTallyClosedVotesByTeamIdRepository(db: Kysely<DB>) {
  return async (teamId: string, now: Date): Promise<VoteTallyEntity[]> => {
    try {
      const rows = await db
        .selectFrom('votes')
        .innerJoin(
          'voting_sessions',
          'voting_sessions.id',
          'votes.voting_session_id',
        )
        .innerJoin('matches', 'matches.id', 'voting_sessions.match_id')
        .select(({ fn }) => [
          'votes.voting_session_id',
          'votes.voted_for_user_id',
          'votes.type',
          fn.count<string>('votes.id').as('count'),
        ])
        .where('votes.deleted_at', 'is', null)
        .where('matches.deleted_at', 'is', null)
        .where('matches.team_id', '=', teamId)
        .where('voting_sessions.closing_at', 'is not', null)
        .where('voting_sessions.closing_at', '<=', now)
        .groupBy([
          'votes.voting_session_id',
          'votes.voted_for_user_id',
          'votes.type',
        ])
        .execute();

      return rows.map((row) => ({
        votingSessionId: row.voting_session_id,
        votedForUserId: row.voted_for_user_id,
        type: row.type as VoteType,
        // Postgres returns count() as a bigint, which the driver hands over as
        // a string.
        count: Number(row.count),
      }));
    } catch (err) {
      throw toDatabaseError(err, 'vote.tallyClosedByTeamId');
    }
  };
}
