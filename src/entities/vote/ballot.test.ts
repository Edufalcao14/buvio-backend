import { VoteEntity } from './vote';
import { VoteType } from './vote-type';
import { ballotProgress, isBallotingUnanimous } from './ballot';

const vote = (createdBy: string, type: VoteType): VoteEntity => ({
  id: `${createdBy}-${type}`,
  votingSessionId: 'session',
  createdBy,
  votedForUserId: 'someone-else',
  type,
  description: null,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  deletedAt: null,
});

const completeBallot = (voterId: string): VoteEntity[] => [
  vote(voterId, VoteType.TOP),
  vote(voterId, VoteType.FLOP),
];

describe('ballotProgress', () => {
  it('reports a ballot complete only with both a top and a flop', () => {
    const progress = ballotProgress(
      ['a', 'b', 'c'],
      [...completeBallot('a'), vote('b', VoteType.TOP)],
    );

    expect(progress).toEqual([
      { voterId: 'a', hasTop: true, hasFlop: true, isComplete: true },
      { voterId: 'b', hasTop: true, hasFlop: false, isComplete: false },
      { voterId: 'c', hasTop: false, hasFlop: false, isComplete: false },
    ]);
  });
});

describe('isBallotingUnanimous', () => {
  it('is unanimous once every player cast both votes', () => {
    expect(
      isBallotingUnanimous(
        ['a', 'b', 'c'],
        [
          ...completeBallot('a'),
          ...completeBallot('b'),
          ...completeBallot('c'),
        ],
      ),
    ).toBe(true);
  });

  it('is not unanimous while one ballot is half cast', () => {
    expect(
      isBallotingUnanimous(
        ['a', 'b', 'c'],
        [
          ...completeBallot('a'),
          ...completeBallot('b'),
          vote('c', VoteType.TOP),
        ],
      ),
    ).toBe(false);
  });

  // A complete ballot needs two different teammates, which a roster of two
  // cannot offer — so unanimity must never fire there, however many votes land.
  it('never fires on a roster of two, even with every possible vote cast', () => {
    expect(
      isBallotingUnanimous(
        ['a', 'b'],
        [vote('a', VoteType.TOP), vote('b', VoteType.TOP)],
      ),
    ).toBe(false);
  });

  it('is not unanimous when nobody voted', () => {
    expect(isBallotingUnanimous(['a', 'b', 'c'], [])).toBe(false);
  });
});
