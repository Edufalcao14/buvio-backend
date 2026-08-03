import { VoteType } from './vote-type';

/**
 * How many votes of one type a single player collected in one session.
 *
 * Counting happens in the database: a closed session is read far more often
 * than it is written, and loading every ballot only to group it in memory
 * scales with the squad size for no reason.
 */
export type VoteTallyEntity = {
  votingSessionId: string;
  votedForUserId: string;
  type: VoteType;
  count: number;
};
