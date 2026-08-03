import { VoteEntity } from './vote';
import { VoteType } from './vote-type';

/**
 * A complete ballot is a Top *and* a Flop (see CONTEXT.md — "Ballot").
 *
 * A player may not vote for themselves and may not give one teammate both
 * Top and Flop, so on a roster of two nobody can ever complete a ballot.
 * Unanimous closure therefore needs at least three players; smaller matches
 * close by admin or deadline only.
 */
export const UNANIMOUS_MIN_ROSTER = 3;

export type BallotProgress = {
  voterId: string;
  hasTop: boolean;
  hasFlop: boolean;
  isComplete: boolean;
};

export const ballotProgress = (
  rosterIds: string[],
  votes: VoteEntity[],
): BallotProgress[] =>
  rosterIds.map((voterId) => {
    const cast = votes.filter((vote) => vote.createdBy === voterId);
    const hasTop = cast.some((vote) => vote.type === VoteType.TOP);
    const hasFlop = cast.some((vote) => vote.type === VoteType.FLOP);

    return { voterId, hasTop, hasFlop, isComplete: hasTop && hasFlop };
  });

/** Whether the roster has finished voting, so the session may close itself. */
export const isBallotingUnanimous = (
  rosterIds: string[],
  votes: VoteEntity[],
): boolean => {
  if (rosterIds.length < UNANIMOUS_MIN_ROSTER) {
    return false;
  }

  return ballotProgress(rosterIds, votes).every(
    (progress) => progress.isComplete,
  );
};
