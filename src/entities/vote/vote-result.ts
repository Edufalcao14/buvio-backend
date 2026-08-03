import { VoteTallyEntity } from './vote-tally';
import { VoteType } from './vote-type';

/**
 * The outcome of a closed voting session: who the squad crowned and who it
 * roasted.
 */
export type VoteResultEntity = {
  topUserId: string;
  flopUserId: string;
};

/**
 * Winner of one category: most votes wins, ties broken by the lowest user id.
 *
 * The tie-break is arbitrary, but it has to be *stable*. The same closed
 * session is read again on every history refresh, and a winner decided by row
 * order or by chance would hand the trophy to a different player between two
 * reads of a vote that can no longer change.
 */
const winnerOf = (
  tallies: VoteTallyEntity[],
  type: VoteType,
): string | null => {
  const ofType = tallies.filter((tally) => tally.type === type);

  if (ofType.length === 0) {
    return null;
  }

  return ofType.reduce((best, candidate) => {
    if (candidate.count !== best.count) {
      return candidate.count > best.count ? candidate : best;
    }

    return candidate.votedForUserId < best.votedForUserId ? candidate : best;
  }).votedForUserId;
};

/**
 * Both categories have to be filled: the API promises a top *and* a flop, so a
 * session where nobody was voted flop has no result to announce yet rather
 * than half of one.
 */
export const resolveVoteResult = (
  tallies: VoteTallyEntity[],
): VoteResultEntity | null => {
  const topUserId = winnerOf(tallies, VoteType.TOP);
  const flopUserId = winnerOf(tallies, VoteType.FLOP);

  if (!topUserId || !flopUserId) {
    return null;
  }

  return { topUserId, flopUserId };
};
