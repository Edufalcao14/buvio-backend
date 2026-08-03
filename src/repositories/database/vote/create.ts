import { Kysely, sql } from 'kysely';
import { DB, VoteType as DatabaseVoteType } from '../models';
import { v4 as uuidv4 } from 'uuid';
import { toVoteEntity } from './mapper/vote';
import { VoteEntity } from '../../../entities/vote/vote';
import { VoteType } from '../../../entities/vote/vote-type';
import { TransactionContext } from '../transactions';
import { isUniqueViolation, toDatabaseError } from '../errors';
import { BadUserInputError } from '../../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';

export function initCreateVoteRepository(db: Kysely<DB>) {
  /**
   * Inserts a vote only while its session is still open.
   *
   * The open-session test is part of the INSERT (`INSERT ... SELECT ... WHERE`)
   * rather than a preceding read, so a vote cannot slip in between the check
   * and the write. Resolves to null when no row was inserted, i.e. the session
   * is gone or has closed.
   */
  return async (
    votingSessionId: string,
    creatorId: string,
    votedUserId: string,
    description: string | null,
    type: VoteType,
    trx?: TransactionContext,
  ): Promise<VoteEntity | null> => {
    try {
      const vote = await (trx || db)
        .insertInto('votes')
        .columns([
          'id',
          'voting_session_id',
          'voted_for_user_id',
          'created_by',
          'type',
          'description',
        ])
        .expression((eb) =>
          eb
            .selectFrom('voting_sessions')
            .select([
              sql<string>`${uuidv4()}::uuid`.as('id'),
              'voting_sessions.id as voting_session_id',
              sql<string>`${votedUserId}::uuid`.as('voted_for_user_id'),
              sql<string>`${creatorId}::uuid`.as('created_by'),
              sql<DatabaseVoteType>`${type}::vote_type`.as('type'),
              sql<string | null>`${description}::varchar`.as('description'),
            ])
            .where('voting_sessions.id', '=', votingSessionId)
            .where('voting_sessions.deleted_at', 'is', null)
            // An explicitly closed session takes no more votes, whatever its
            // scheduled deadline says.
            .where('voting_sessions.closed_at', 'is', null)
            .where((w) =>
              w.or([
                w('voting_sessions.closing_at', 'is', null),
                w('voting_sessions.closing_at', '>', sql<Date>`now()`),
              ]),
            ),
        )
        .returningAll()
        .executeTakeFirst();

      return vote ? toVoteEntity(vote) : null;
    } catch (err) {
      // One vote per (session, voter, type) is a database constraint, so two
      // concurrent submissions of the same vote cannot both land.
      if (isUniqueViolation(err)) {
        throw new BadUserInputError(
          ErrorMessageCode.VOTE_ALREADY_CAST_FOR_TYPE,
          { type },
        );
      }
      throw toDatabaseError(err, 'vote.create');
    }
  };
}
