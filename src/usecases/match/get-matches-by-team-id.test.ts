import { ForbiddenError } from '../../entities/errors/forbidden-error';
import { tests } from '../../libs/tests';
import { Setup } from '../../libs/tests/setup/setup';
import { getMatchesByTeamId } from './get-matches-by-team-id';

const { helpers } = tests;

describe('getMatchesByTeamId', () => {
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

  /** A squad with `count` matches, newest last in creation order. */
  const aTeamWithMatches = async (count: number) => {
    const { user, team } = await helpers.insertUserWithTeam(setup.db);

    for (let index = 0; index < count; index += 1) {
      await helpers.insertMatch(
        setup.db,
        { teamId: team.id, createdBy: user.id },
        {
          name: `Match ${index + 1}`,
          // One per day, so "most recent first" is unambiguous.
          date: new Date(2026, 0, index + 1),
        },
      );
    }

    return {
      team,
      context: setup.context(helpers.authenticatedAs(user.external_id)),
    };
  };

  it('returns every match when no page is asked for', async () => {
    const { team, context } = await aTeamWithMatches(5);

    const matches = await getMatchesByTeamId(context, team.id);

    expect(matches).toHaveLength(5);
  });

  it('returns only the page asked for, most recent first', async () => {
    const { team, context } = await aTeamWithMatches(5);

    const firstPage = await getMatchesByTeamId(context, team.id, { limit: 2 });

    expect(firstPage).toHaveLength(2);
    // Newest first: the last one created carries the latest date.
    expect(firstPage.map((match) => match.name)).toEqual([
      'Match 5',
      'Match 4',
    ]);
  });

  it('walks the archive with offset without repeating or skipping', async () => {
    const { team, context } = await aTeamWithMatches(5);

    const first = await getMatchesByTeamId(context, team.id, { limit: 2 });
    const second = await getMatchesByTeamId(context, team.id, {
      limit: 2,
      offset: 2,
    });
    const third = await getMatchesByTeamId(context, team.id, {
      limit: 2,
      offset: 4,
    });

    expect(second.map((m) => m.name)).toEqual(['Match 3', 'Match 2']);
    expect(third.map((m) => m.name)).toEqual(['Match 1']);

    const names = [...first, ...second, ...third].map((m) => m.name);
    expect(new Set(names).size).toBe(5);
  });

  it('still refuses another team, paginated or not', async () => {
    const { context } = await aTeamWithMatches(3);
    const other = await helpers.insertUserWithTeam(setup.db);

    await expect(
      getMatchesByTeamId(context, other.team.id, { limit: 1 }),
    ).rejects.toThrow(ForbiddenError);
  });
});
