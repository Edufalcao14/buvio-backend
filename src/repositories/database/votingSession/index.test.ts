import { NotFoundError } from '../../../entities/errors/not-found-error';
import { BadUserInputError } from '../../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { tests } from '../../../libs/tests';
import { Setup } from '../../../libs/tests/setup/setup';

const { helpers } = tests;

describe('votingSession repositories', () => {
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

  const aMatch = async () => {
    const { user, team } = await helpers.insertUserWithTeam(setup.db);
    const match = await helpers.insertMatch(setup.db, {
      teamId: team.id,
      createdBy: user.id,
    });
    return { user, team, match };
  };

  describe('create', () => {
    it('inserts a session with a closing date', async () => {
      const { user, match } = await aMatch();
      const closingAt = new Date('2030-05-01T20:00:00.000Z');

      const session = await setup
        .freshRepositories()
        .votingSession.create(match.id, closingAt, user.id);

      expect(session).toMatchObject({
        matchId: match.id,
        startedBy: user.id,
      });
      expect(session.closingAt?.toISOString()).toBe(closingAt.toISOString());
    });

    it('inserts a session with no closing date, meaning manual closing only', async () => {
      const { user, match } = await aMatch();

      const session = await setup
        .freshRepositories()
        .votingSession.create(match.id, null, user.id);

      expect(session.closingAt).toBeNull();
    });

    // Two concurrent createVotingSession calls used to both pass the
    // application-level check and both insert.
    it('refuses a second session for the same match', async () => {
      const { user, match } = await aMatch();
      const repositories = setup.freshRepositories();
      await repositories.votingSession.create(match.id, null, user.id);

      const duplicate = repositories.votingSession.create(
        match.id,
        null,
        user.id,
      );

      await expect(duplicate).rejects.toBeInstanceOf(BadUserInputError);
      await expect(duplicate).rejects.toMatchObject({
        errorCode: ErrorMessageCode.VOTING_SESSION_ALREADY_EXISTS,
      });
    });

    it('refuses a second session even when both inserts race', async () => {
      const { user, match } = await aMatch();
      const repositories = setup.freshRepositories();

      const results = await Promise.allSettled([
        repositories.votingSession.create(match.id, null, user.id),
        repositories.votingSession.create(match.id, null, user.id),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    });

    it('rolls back with the surrounding transaction', async () => {
      const { user, match } = await aMatch();
      const repositories = setup.freshRepositories();

      await expect(
        repositories.transaction.transaction().execute(async (trx) => {
          await repositories.votingSession.create(match.id, null, user.id, trx);
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      await expect(
        setup.freshRepositories().votingSession.getByMatchId(match.id),
      ).resolves.toBeNull();
    });
  });

  describe('getById', () => {
    it('returns the session', async () => {
      const { user, match } = await aMatch();
      const inserted = await helpers.insertVotingSession(setup.db, {
        matchId: match.id,
        startedBy: user.id,
      });

      const session = await setup
        .freshRepositories()
        .votingSession.getById(inserted.id);

      expect(session.id).toBe(inserted.id);
    });

    it('rejects with VOTING_SESSION_NOT_FOUND for an unknown id', async () => {
      const missing = setup
        .freshRepositories()
        .votingSession.getById('66666666-6666-6666-6666-666666666666');

      await expect(missing).rejects.toBeInstanceOf(NotFoundError);
      await expect(missing).rejects.toMatchObject({
        errorCode: ErrorMessageCode.VOTING_SESSION_NOT_FOUND,
      });
    });

    // The batch loader used to throw on a miss, which failed every other key
    // sharing the batch.
    it('resolves present ids even when a sibling id in the batch is missing', async () => {
      const { user, match } = await aMatch();
      const inserted = await helpers.insertVotingSession(setup.db, {
        matchId: match.id,
        startedBy: user.id,
      });
      const repositories = setup.freshRepositories();

      const [found, missing] = await Promise.allSettled([
        repositories.votingSession.getById(inserted.id),
        repositories.votingSession.getById(
          '77777777-7777-7777-7777-777777777777',
        ),
      ]);

      expect(found.status).toBe('fulfilled');
      expect(missing.status).toBe('rejected');
    });
  });

  describe('getByMatchId', () => {
    it('returns the session of the match', async () => {
      const { user, match } = await aMatch();
      const inserted = await helpers.insertVotingSession(setup.db, {
        matchId: match.id,
        startedBy: user.id,
      });

      const session = await setup
        .freshRepositories()
        .votingSession.getByMatchId(match.id);

      expect(session?.id).toBe(inserted.id);
    });

    it('returns null when the match has no session', async () => {
      const { match } = await aMatch();

      await expect(
        setup.freshRepositories().votingSession.getByMatchId(match.id),
      ).resolves.toBeNull();
    });

    it('ignores soft-deleted sessions', async () => {
      const { user, match } = await aMatch();
      await helpers.insertVotingSession(
        setup.db,
        { matchId: match.id, startedBy: user.id },
        { deleted_at: new Date() },
      );

      await expect(
        setup.freshRepositories().votingSession.getByMatchId(match.id),
      ).resolves.toBeNull();
    });

    // This lookup had no batching, so listing N matches with their session ran
    // N queries.
    it('keeps the sessions of different matches separate when batched together', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const firstMatch = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });
      const secondMatch = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });
      const thirdMatch = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });
      const firstSession = await helpers.insertVotingSession(setup.db, {
        matchId: firstMatch.id,
        startedBy: user.id,
      });
      const secondSession = await helpers.insertVotingSession(setup.db, {
        matchId: secondMatch.id,
        startedBy: user.id,
      });
      const repositories = setup.freshRepositories();

      const [first, second, third] = await Promise.all([
        repositories.votingSession.getByMatchId(firstMatch.id),
        repositories.votingSession.getByMatchId(secondMatch.id),
        repositories.votingSession.getByMatchId(thirdMatch.id),
      ]);

      expect(first?.id).toBe(firstSession.id);
      expect(second?.id).toBe(secondSession.id);
      expect(third).toBeNull();
    });
  });
});
