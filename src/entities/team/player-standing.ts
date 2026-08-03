import { VoteTallyEntity } from '../vote/vote-tally';
import { VoteType } from '../vote/vote-type';

/**
 * One player's season so far: how often the squad crowned them, how often it
 * roasted them.
 */
export type PlayerStandingEntity = {
  userId: string;
  topCount: number;
  flopCount: number;
};

/**
 * Builds the table from the squad list and the counted votes.
 *
 * Every member is listed, including the ones nobody ever voted for: a
 * standings table that silently drops players reads as a bug to the player who
 * cannot find themselves in it.
 *
 * Order: most tops first, then fewest flops, then user id. The last key is
 * arbitrary but keeps the table stable across reads — a ranking that reshuffles
 * two tied players on every refresh looks broken.
 */
export const buildRanking = (
  memberIds: string[],
  tallies: VoteTallyEntity[],
): PlayerStandingEntity[] => {
  const standings = new Map<string, PlayerStandingEntity>(
    memberIds.map((userId) => [userId, { userId, topCount: 0, flopCount: 0 }]),
  );

  for (const tally of tallies) {
    const standing = standings.get(tally.votedForUserId);

    // A vote for someone who has since left the team keeps its history but has
    // no row in this table.
    if (!standing) {
      continue;
    }

    if (tally.type === VoteType.TOP) {
      standing.topCount += tally.count;
    } else {
      standing.flopCount += tally.count;
    }
  }

  return [...standings.values()].sort((a, b) => {
    if (a.topCount !== b.topCount) {
      return b.topCount - a.topCount;
    }

    if (a.flopCount !== b.flopCount) {
      return a.flopCount - b.flopCount;
    }

    return a.userId < b.userId ? -1 : 1;
  });
};
