import { NotFoundError } from '../../../entities/errors/not-found-error';
import { BadUserInputError } from '../../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { VoteType } from '../../../entities/vote/vote-type';
import { tests } from '../../../libs/tests';
import { Setup } from '../../../libs/tests/setup/setup';

const { helpers } = tests;

describe('vote repositories', () => {
  let setup: Setup;

  beforeAll(async () => {
    setup = await tests.setup();
  });

  afterAll(async () => {
    await setup.onStop();
  });

  beforeEach(async () => {
    await helpers.resetDatabase(setup.db);
  });

  /** A team with two players, a match, and an open voting session. */
  const anOpenSession = async (closingAt: Date | null = null) => {
    const { user: voter, team } = await helpers.insertUserWithTeam(setup.db);
    const teammate = await helpers.insertUser(setup.db, { team_id: team.id });
    const match = await helpers.insertMatch(setup.db, {
      teamId: team.id,
      createdBy: voter.id,
    });
    const session = await helpers.insertVotingSession(
      setup.db,
      { matchId: match.id, startedBy: voter.id },
      { closing_at: closingAt },
    );
    return { voter, teammate, team, match, session };
  };

  describe('create', () => {
    it('inserts a vote and returns the entity', async () => {
      const { voter, teammate, session } = await anOpenSession();

      const vote = await setup
        .freshRepositories()
        .vote.create(
          session.id,
          voter.id,
          teammate.id,
          'Great game',
          VoteType.TOP,
        );

      expect(vote).toMatchObject({
        votingSessionId: session.id,
        createdBy: voter.id,
        votedForUserId: teammate.id,
        description: 'Great game',
        type: VoteType.TOP,
        deletedAt: null,
      });
    });

    it('accepts a vote with no description', async () => {
      const { voter, teammate, session } = await anOpenSession();

      const vote = await setup
        .freshRepositories()
        .vote.create(session.id, voter.id, teammate.id, null, VoteType.FLOP);

      expect(vote?.description).toBeNull();
      expect(vote?.type).toBe(VoteType.FLOP);
    });

    it('accepts a vote while the closing date is still in the future', async () => {
      const { voter, teammate, session } = await anOpenSession(
        new Date(Date.now() + 60_000),
      );

      const vote = await setup
        .freshRepositories()
        .vote.create(session.id, voter.id, teammate.id, null, VoteType.TOP);

      expect(vote).not.toBeNull();
    });

    // The closing check is part of the INSERT, so a vote cannot slip in between
    // an application-level check and the write.
    it('inserts nothing once the session has closed', async () => {
      const { voter, teammate, session } = await anOpenSession(
        new Date(Date.now() - 60_000),
      );

      const vote = await setup
        .freshRepositories()
        .vote.create(session.id, voter.id, teammate.id, null, VoteType.TOP);

      expect(vote).toBeNull();
      const stored = await setup
        .freshRepositories()
        .vote.listByUserAndVotingSession(voter.id, session.id);
      expect(stored).toEqual([]);
    });

    it('inserts nothing when the session does not exist', async () => {
      const { voter, teammate } = await anOpenSession();

      const vote = await setup
        .freshRepositories()
        .vote.create(
          '88888888-8888-8888-8888-888888888888',
          voter.id,
          teammate.id,
          null,
          VoteType.TOP,
        );

      expect(vote).toBeNull();
    });

    it('allows one TOP and one FLOP from the same voter', async () => {
      const { voter, teammate, team, session } = await anOpenSession();
      const third = await helpers.insertUser(setup.db, { team_id: team.id });
      const repositories = setup.freshRepositories();

      await repositories.vote.create(
        session.id,
        voter.id,
        teammate.id,
        null,
        VoteType.TOP,
      );
      const flop = await repositories.vote.create(
        session.id,
        voter.id,
        third.id,
        null,
        VoteType.FLOP,
      );

      expect(flop).not.toBeNull();
    });

    // Without the unique index both concurrent submissions passed the
    // application check and both inserted, double-counting the vote.
    it('refuses a second vote of the same type from the same voter', async () => {
      const { voter, teammate, team, session } = await anOpenSession();
      const third = await helpers.insertUser(setup.db, { team_id: team.id });
      const repositories = setup.freshRepositories();
      await repositories.vote.create(
        session.id,
        voter.id,
        teammate.id,
        null,
        VoteType.TOP,
      );

      const duplicate = repositories.vote.create(
        session.id,
        voter.id,
        third.id,
        null,
        VoteType.TOP,
      );

      await expect(duplicate).rejects.toBeInstanceOf(BadUserInputError);
      await expect(duplicate).rejects.toMatchObject({
        errorCode: ErrorMessageCode.VOTE_ALREADY_CAST_FOR_TYPE,
      });
    });

    it('refuses the second vote even when both inserts race', async () => {
      const { voter, teammate, session } = await anOpenSession();
      const repositories = setup.freshRepositories();

      const results = await Promise.allSettled([
        repositories.vote.create(
          session.id,
          voter.id,
          teammate.id,
          null,
          VoteType.TOP,
        ),
        repositories.vote.create(
          session.id,
          voter.id,
          teammate.id,
          null,
          VoteType.TOP,
        ),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    });

    it('lets two different voters cast the same type', async () => {
      const { voter, teammate, session } = await anOpenSession();
      const repositories = setup.freshRepositories();

      await repositories.vote.create(
        session.id,
        voter.id,
        teammate.id,
        null,
        VoteType.TOP,
      );
      const second = await repositories.vote.create(
        session.id,
        teammate.id,
        voter.id,
        null,
        VoteType.TOP,
      );

      expect(second).not.toBeNull();
    });

    it('rolls back with the surrounding transaction', async () => {
      const { voter, teammate, session } = await anOpenSession();
      const repositories = setup.freshRepositories();

      await expect(
        repositories.transaction.transaction().execute(async (trx) => {
          await repositories.vote.create(
            session.id,
            voter.id,
            teammate.id,
            null,
            VoteType.TOP,
            trx,
          );
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      await expect(
        setup
          .freshRepositories()
          .vote.listByUserAndVotingSession(voter.id, session.id),
      ).resolves.toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns the vote', async () => {
      const { voter, teammate, session } = await anOpenSession();
      const inserted = await helpers.insertVote(setup.db, {
        votingSessionId: session.id,
        createdBy: voter.id,
        votedForUserId: teammate.id,
      });

      const vote = await setup.freshRepositories().vote.getById(inserted.id);

      expect(vote.id).toBe(inserted.id);
    });

    it('rejects with VOTE_NOT_FOUND for an unknown id', async () => {
      const missing = setup
        .freshRepositories()
        .vote.getById('99999999-9999-9999-9999-999999999999');

      await expect(missing).rejects.toBeInstanceOf(NotFoundError);
      await expect(missing).rejects.toMatchObject({
        errorCode: ErrorMessageCode.VOTE_NOT_FOUND,
      });
    });
  });

  describe('getByUserAndVotingSession', () => {
    it('returns null when the user has not voted', async () => {
      const { voter, session } = await anOpenSession();

      await expect(
        setup
          .freshRepositories()
          .vote.getByUserAndVotingSession(voter.id, session.id),
      ).resolves.toBeNull();
    });

    it('finds the vote of the requested type', async () => {
      const { voter, teammate, team, session } = await anOpenSession();
      const third = await helpers.insertUser(setup.db, { team_id: team.id });
      await helpers.insertVote(setup.db, {
        votingSessionId: session.id,
        createdBy: voter.id,
        votedForUserId: teammate.id,
      });
      await helpers.insertVote(
        setup.db,
        {
          votingSessionId: session.id,
          createdBy: voter.id,
          votedForUserId: third.id,
        },
        { type: 'FLOP' },
      );

      const flop = await setup
        .freshRepositories()
        .vote.getByUserAndVotingSession(voter.id, session.id, VoteType.FLOP);

      expect(flop?.votedForUserId).toBe(third.id);
    });

    it('ignores the votes of other users', async () => {
      const { voter, teammate, session } = await anOpenSession();
      await helpers.insertVote(setup.db, {
        votingSessionId: session.id,
        createdBy: teammate.id,
        votedForUserId: voter.id,
      });

      await expect(
        setup
          .freshRepositories()
          .vote.getByUserAndVotingSession(voter.id, session.id),
      ).resolves.toBeNull();
    });
  });

  describe('listByUserAndVotingSession', () => {
    // Callers must see both categories: reading a single row hid the other one
    // and let a voter cast the same person as TOP and FLOP.
    it('returns every vote the user cast in the session', async () => {
      const { voter, teammate, team, session } = await anOpenSession();
      const third = await helpers.insertUser(setup.db, { team_id: team.id });
      await helpers.insertVote(setup.db, {
        votingSessionId: session.id,
        createdBy: voter.id,
        votedForUserId: teammate.id,
      });
      await helpers.insertVote(
        setup.db,
        {
          votingSessionId: session.id,
          createdBy: voter.id,
          votedForUserId: third.id,
        },
        { type: 'FLOP' },
      );

      const votes = await setup
        .freshRepositories()
        .vote.listByUserAndVotingSession(voter.id, session.id);

      expect(votes).toHaveLength(2);
      expect(votes.map((vote) => vote.type).sort()).toEqual(['FLOP', 'TOP']);
    });

    it('returns an empty list when the user has not voted', async () => {
      const { voter, session } = await anOpenSession();

      await expect(
        setup
          .freshRepositories()
          .vote.listByUserAndVotingSession(voter.id, session.id),
      ).resolves.toEqual([]);
    });

    it('excludes soft-deleted votes', async () => {
      const { voter, teammate, session } = await anOpenSession();
      await helpers.insertVote(
        setup.db,
        {
          votingSessionId: session.id,
          createdBy: voter.id,
          votedForUserId: teammate.id,
        },
        { deleted_at: new Date() },
      );

      await expect(
        setup
          .freshRepositories()
          .vote.listByUserAndVotingSession(voter.id, session.id),
      ).resolves.toEqual([]);
    });
  });

  describe('tallyByVotingSessionId', () => {
    it('counts votes per player and category', async () => {
      const { voter, teammate, session } = await anOpenSession();
      await helpers.insertVote(setup.db, {
        votingSessionId: session.id,
        createdBy: voter.id,
        votedForUserId: teammate.id,
      });
      await helpers.insertVote(
        setup.db,
        {
          votingSessionId: session.id,
          createdBy: teammate.id,
          votedForUserId: teammate.id,
        },
        { type: VoteType.TOP },
      );
      await helpers.insertVote(
        setup.db,
        {
          votingSessionId: session.id,
          createdBy: teammate.id,
          votedForUserId: voter.id,
        },
        { type: VoteType.FLOP },
      );

      const tallies = await setup
        .freshRepositories()
        .vote.tallyByVotingSessionId(session.id);

      expect(tallies).toEqual(
        expect.arrayContaining([
          {
            votingSessionId: session.id,
            votedForUserId: teammate.id,
            type: VoteType.TOP,
            count: 2,
          },
          {
            votingSessionId: session.id,
            votedForUserId: voter.id,
            type: VoteType.FLOP,
            count: 1,
          },
        ]),
      );
      expect(tallies).toHaveLength(2);
    });

    it('excludes soft-deleted votes', async () => {
      const { voter, teammate, session } = await anOpenSession();
      await helpers.insertVote(
        setup.db,
        {
          votingSessionId: session.id,
          createdBy: voter.id,
          votedForUserId: teammate.id,
        },
        { deleted_at: new Date() },
      );

      await expect(
        setup.freshRepositories().vote.tallyByVotingSessionId(session.id),
      ).resolves.toEqual([]);
    });

    it('never mixes two sessions into one tally', async () => {
      const first = await anOpenSession();
      const second = await anOpenSession();
      await helpers.insertVote(setup.db, {
        votingSessionId: first.session.id,
        createdBy: first.voter.id,
        votedForUserId: first.teammate.id,
      });
      await helpers.insertVote(setup.db, {
        votingSessionId: second.session.id,
        createdBy: second.voter.id,
        votedForUserId: second.teammate.id,
      });

      const repositories = setup.freshRepositories();
      // Loaded together so both ids go through one batched query.
      const [firstTallies, secondTallies] = await Promise.all([
        repositories.vote.tallyByVotingSessionId(first.session.id),
        repositories.vote.tallyByVotingSessionId(second.session.id),
      ]);

      expect(firstTallies).toEqual([
        {
          votingSessionId: first.session.id,
          votedForUserId: first.teammate.id,
          type: VoteType.TOP,
          count: 1,
        },
      ]);
      expect(secondTallies).toEqual([
        {
          votingSessionId: second.session.id,
          votedForUserId: second.teammate.id,
          type: VoteType.TOP,
          count: 1,
        },
      ]);
    });

    it('returns an empty tally for a session nobody voted in', async () => {
      const { session } = await anOpenSession();

      await expect(
        setup.freshRepositories().vote.tallyByVotingSessionId(session.id),
      ).resolves.toEqual([]);
    });
  });
});
