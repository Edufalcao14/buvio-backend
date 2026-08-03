import { resolveVoteResult } from './vote-result';
import { VoteTallyEntity } from './vote-tally';
import { VoteType } from './vote-type';

const tally = (
  votedForUserId: string,
  type: VoteType,
  count: number,
): VoteTallyEntity => ({
  votingSessionId: 'session',
  votedForUserId,
  type,
  count,
});

describe('resolveVoteResult', () => {
  it('crowns the most voted player in each category', () => {
    const result = resolveVoteResult([
      tally('player-a', VoteType.TOP, 3),
      tally('player-b', VoteType.TOP, 1),
      tally('player-b', VoteType.FLOP, 2),
      tally('player-a', VoteType.FLOP, 1),
    ]);

    expect(result).toEqual({ topUserId: 'player-a', flopUserId: 'player-b' });
  });

  it('breaks ties by the lowest user id, whatever the tally order', () => {
    const ascending = resolveVoteResult([
      tally('player-a', VoteType.TOP, 2),
      tally('player-b', VoteType.TOP, 2),
      tally('player-c', VoteType.FLOP, 1),
    ]);

    const descending = resolveVoteResult([
      tally('player-b', VoteType.TOP, 2),
      tally('player-a', VoteType.TOP, 2),
      tally('player-c', VoteType.FLOP, 1),
    ]);

    expect(ascending?.topUserId).toBe('player-a');
    expect(descending?.topUserId).toBe('player-a');
  });

  it('has no result when a category received no vote', () => {
    expect(resolveVoteResult([tally('player-a', VoteType.TOP, 2)])).toBeNull();
    expect(resolveVoteResult([])).toBeNull();
  });

  it('lets the same player be both top and flop', () => {
    const result = resolveVoteResult([
      tally('player-a', VoteType.TOP, 2),
      tally('player-a', VoteType.FLOP, 3),
    ]);

    expect(result).toEqual({ topUserId: 'player-a', flopUserId: 'player-a' });
  });
});
