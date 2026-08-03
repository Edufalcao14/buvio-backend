import { ForbiddenError } from '../../entities/errors/forbidden-error';
import { ClosureReason } from '../../entities/votingSession/closure-reason';
import { tests } from '../../libs/tests';
import { Setup } from '../../libs/tests/setup/setup';
import { closeVotingSession } from './close-voting-session';
import { closeOverdueVotingSessions } from './close-overdue-sessions';

const { helpers } = tests;

describe('closing a voting session', () => {
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

  const aSession = async (closingAt: Date | null) => {
    const { user: admin, team } = await helpers.insertUserWithTeam(setup.db);
    const teammate = await helpers.insertUser(setup.db, { team_id: team.id });
    const match = await helpers.insertMatch(setup.db, {
      teamId: team.id,
      createdBy: admin.id,
    });
    const session = await helpers.insertVotingSession(
      setup.db,
      { matchId: match.id, startedBy: admin.id },
      { closing_at: closingAt },
    );

    return { admin, teammate, team, match, session };
  };

  describe('by the admin', () => {
    it('closes the session and records who ended it', async () => {
      const { admin, session } = await aSession(null);
      const context = setup.context(helpers.authenticatedAs(admin.external_id));

      const closed = await closeVotingSession(context, session.id);

      expect(closed.closedReason).toBe(ClosureReason.ADMIN);
      expect(closed.closedAt).toBeInstanceOf(Date);
    });

    it('refuses anyone who did not start the session', async () => {
      const { teammate, session } = await aSession(null);
      const context = setup.context(
        helpers.authenticatedAs(teammate.external_id),
      );

      await expect(
        closeVotingSession(context, session.id),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });

    // Closing twice must not rewrite the reason: the first ending is the one
    // that happened, and a second "closed" event would replay the reveal.
    it('keeps the first closure when called twice', async () => {
      const { admin, session } = await aSession(null);
      const context = setup.context(helpers.authenticatedAs(admin.external_id));

      const first = await closeVotingSession(context, session.id);
      const second = await closeVotingSession(context, session.id);

      expect(second.closedAt).toEqual(first.closedAt);
      expect(second.closedReason).toBe(ClosureReason.ADMIN);
    });
  });

  describe('by deadline', () => {
    it('closes sessions whose deadline has passed', async () => {
      const { session } = await aSession(new Date(Date.now() - 60_000));
      const context = setup.context(helpers.anonymous());

      await expect(closeOverdueVotingSessions(context)).resolves.toBe(1);

      const closed = await setup.repositories.votingSession.getById(session.id);
      expect(closed.closedReason).toBe(ClosureReason.DEADLINE);
    });

    it('leaves a session whose deadline is still ahead alone', async () => {
      await aSession(new Date(Date.now() + 60_000));
      const context = setup.context(helpers.anonymous());

      await expect(closeOverdueVotingSessions(context)).resolves.toBe(0);
    });

    it('closes nothing on a second sweep, so no verdict is announced twice', async () => {
      await aSession(new Date(Date.now() - 60_000));
      const context = setup.context(helpers.anonymous());

      await expect(closeOverdueVotingSessions(context)).resolves.toBe(1);
      await expect(closeOverdueVotingSessions(context)).resolves.toBe(0);
    });
  });
});
