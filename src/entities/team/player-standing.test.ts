import { VoteTallyEntity } from '../vote/vote-tally';
import { VoteType } from '../vote/vote-type';
import { buildRanking } from './player-standing';

const tally = (
  votedForUserId: string,
  type: VoteType,
  count: number,
  votingSessionId = 'session',
): VoteTallyEntity => ({
  votingSessionId,
  votedForUserId,
  type,
  count,
});

describe('buildRanking', () => {
  it('sums a player’s votes across every session', () => {
    const ranking = buildRanking(
      ['a'],
      [
        tally('a', VoteType.TOP, 2, 'session-1'),
        tally('a', VoteType.TOP, 1, 'session-2'),
        tally('a', VoteType.FLOP, 1, 'session-2'),
      ],
    );

    expect(ranking).toEqual([{ userId: 'a', topCount: 3, flopCount: 1 }]);
  });

  it('lists members nobody voted for', () => {
    const ranking = buildRanking(['a', 'b'], [tally('a', VoteType.TOP, 1)]);

    expect(ranking).toEqual([
      { userId: 'a', topCount: 1, flopCount: 0 },
      { userId: 'b', topCount: 0, flopCount: 0 },
    ]);
  });

  it('ranks by tops, then by fewest flops, then stably', () => {
    const ranking = buildRanking(
      ['c', 'b', 'a'],
      [
        tally('a', VoteType.TOP, 2),
        tally('b', VoteType.TOP, 2),
        tally('c', VoteType.TOP, 2),
        tally('a', VoteType.FLOP, 3),
      ],
    );

    expect(ranking.map((standing) => standing.userId)).toEqual(['b', 'c', 'a']);
  });

  it('ignores votes for someone who left the team', () => {
    const ranking = buildRanking(['a'], [tally('gone', VoteType.TOP, 5)]);

    expect(ranking).toEqual([{ userId: 'a', topCount: 0, flopCount: 0 }]);
  });
});
