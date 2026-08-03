import { NotFoundError } from '../../entities/errors/not-found-error';
import { VoteType } from '../../entities/vote/vote-type';
import { tests } from '../../libs/tests';
import { Setup } from '../../libs/tests/setup/setup';
import { getVoteResult } from './get-vote-result';

const { helpers } = tests;

const IN_THE_PAST = new Date(Date.now() - 60_000);
const IN_THE_FUTURE = new Date(Date.now() + 60_000);

describe('getVoteResult', () => {
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

  /** A team of two with a match and a session closing at `closingAt`. */
  const aSession = async (closingAt: Date | null) => {
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

  const bothCategoriesVoted = async (
    sessionId: string,
    voterId: string,
    teammateId: string,
  ) => {
    await helpers.insertVote(
      setup.db,
      {
        votingSessionId: sessionId,
        createdBy: voterId,
        votedForUserId: teammateId,
      },
      { type: VoteType.TOP },
    );
    await helpers.insertVote(
      setup.db,
      {
        votingSessionId: sessionId,
        createdBy: teammateId,
        votedForUserId: voterId,
      },
      { type: VoteType.FLOP },
    );
  };

  /** The resolver hands the usecase a session entity, so tests do the same. */
  const sessionEntityOf = async (sessionId: string) =>
    setup.repositories.votingSession.getById(sessionId);

  it('announces the verdict once the session has closed', async () => {
    const { voter, teammate, session } = await aSession(IN_THE_PAST);
    await bothCategoriesVoted(session.id, voter.id, teammate.id);

    const context = setup.context(helpers.authenticatedAs(voter.external_id));
    const entity = await sessionEntityOf(session.id);

    await expect(getVoteResult(context, entity)).resolves.toEqual({
      topUserId: teammate.id,
      flopUserId: voter.id,
    });
  });

  it('keeps the result sealed while the vote is still open', async () => {
    const { voter, teammate, session } = await aSession(IN_THE_FUTURE);
    await bothCategoriesVoted(session.id, voter.id, teammate.id);

    const context = setup.context(helpers.authenticatedAs(voter.external_id));
    const entity = await sessionEntityOf(session.id);

    await expect(getVoteResult(context, entity)).resolves.toBeNull();
  });

  it('keeps a session that never closes on its own sealed too', async () => {
    const { voter, teammate, session } = await aSession(null);
    await bothCategoriesVoted(session.id, voter.id, teammate.id);

    const context = setup.context(helpers.authenticatedAs(voter.external_id));
    const entity = await sessionEntityOf(session.id);

    await expect(getVoteResult(context, entity)).resolves.toBeNull();
  });

  it('has nothing to announce when a closed session got no vote', async () => {
    const { voter, session } = await aSession(IN_THE_PAST);

    const context = setup.context(helpers.authenticatedAs(voter.external_id));
    const entity = await sessionEntityOf(session.id);

    await expect(getVoteResult(context, entity)).resolves.toBeNull();
  });

  it('refuses to read the verdict of another team’s session', async () => {
    const { voter, teammate, session } = await aSession(IN_THE_PAST);
    await bothCategoriesVoted(session.id, voter.id, teammate.id);
    const { user: outsider } = await helpers.insertUserWithTeam(setup.db);

    const context = setup.context(
      helpers.authenticatedAs(outsider.external_id),
    );
    const entity = await sessionEntityOf(session.id);

    await expect(getVoteResult(context, entity)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
