import { Kysely } from 'kysely';
import { DB } from '../models';
import { VoteTallyEntity } from '../../../entities/vote/vote-tally';
import { VoteType } from '../../../entities/vote/vote-type';
import { toDatabaseError } from '../errors';

/**
 * Vote counts per player and category for a batch of sessions.
 *
 * Batched because the history screen resolves one result per match: without a
 * loader a season of matches is one grouped query each.
 */
export function initTallyVotesByVotingSessionIdsRepository(db: Kysely<DB>) {
  return async (
    votingSessionIds: readonly string[],
  ): Promise<VoteTallyEntity[][]> => {
    try {
      const rows = await db
        .selectFrom('votes')
        .select(({ fn }) => [
          'votes.voting_session_id',
          'votes.voted_for_user_id',
          'votes.type',
          fn.count<string>('votes.id').as('count'),
        ])
        .where('votes.deleted_at', 'is', null)
        .where('votes.voting_session_id', 'in', votingSessionIds)
        .groupBy([
          'votes.voting_session_id',
          'votes.voted_for_user_id',
          'votes.type',
        ])
        .execute();

      const talliesBySessionId = new Map<string, VoteTallyEntity[]>();

      for (const row of rows) {
        const sessionTallies =
          talliesBySessionId.get(row.voting_session_id) ?? [];

        sessionTallies.push({
          votingSessionId: row.voting_session_id,
          votedForUserId: row.voted_for_user_id,
          type: row.type as VoteType,
          // Postgres returns count() as a bigint, which the driver hands over
          // as a string.
          count: Number(row.count),
        });

        talliesBySessionId.set(row.voting_session_id, sessionTallies);
      }

      return votingSessionIds.map(
        (votingSessionId) => talliesBySessionId.get(votingSessionId) ?? [],
      );
    } catch (err) {
      throw toDatabaseError(err, 'vote.tallyByVotingSessionIds');
    }
  };
}
