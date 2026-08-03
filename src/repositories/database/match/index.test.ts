import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { MatchType } from '../../../entities/match/match-type';
import { tests } from '../../../libs/tests';
import { Setup } from '../../../libs/tests/setup/setup';

const { helpers } = tests;

describe('match repositories', () => {
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

  describe('create', () => {
    it('inserts a match and maps the type to the domain enum', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const date = new Date('2030-01-15T20:00:00.000Z');

      const match = await setup
        .freshRepositories()
        .match.create('Final', date, 'CHAMPIONNAT', user.id, team.id);

      expect(match).toMatchObject({
        name: 'Final',
        type: MatchType.CHAMPIONNAT,
        creatorId: user.id,
        teamId: team.id,
        deletedAt: null,
      });
      expect(match.date.toISOString()).toBe(date.toISOString());
    });

    it('rolls back with the surrounding transaction', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const repositories = setup.freshRepositories();
      let matchId = '';

      await expect(
        repositories.transaction.transaction().execute(async (trx) => {
          const match = await repositories.match.create(
            'Ghost',
            new Date('2030-02-01T18:00:00.000Z'),
            'AMICAL',
            user.id,
            team.id,
            trx,
          );
          matchId = match.id;
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      await expect(
        setup.freshRepositories().match.getById(matchId),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('addPlayer', () => {
    // The insert used never to be awaited, so the row could appear after the
    // transaction had already committed, or not at all.
    it('is awaited, so the row exists once the call resolves', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const repositories = setup.freshRepositories();
      const match = await repositories.match.create(
        'With players',
        new Date('2030-03-01T18:00:00.000Z'),
        'AMICAL',
        user.id,
        team.id,
      );

      await repositories.match.addPlayer(user.id, match.id);

      const players = await setup
        .freshRepositories()
        .match.getPlayersByMatchId(match.id);
      expect(players.map((player) => player.id)).toEqual([user.id]);
    });

    it('rolls back with the surrounding transaction', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const repositories = setup.freshRepositories();
      const match = await repositories.match.create(
        'Rollback',
        new Date('2030-03-02T18:00:00.000Z'),
        'AMICAL',
        user.id,
        team.id,
      );

      await expect(
        repositories.transaction.transaction().execute(async (trx) => {
          await repositories.match.addPlayer(user.id, match.id, trx);
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      await expect(
        setup.freshRepositories().match.getPlayersByMatchId(match.id),
      ).resolves.toEqual([]);
    });
  });

  describe('getById', () => {
    it('returns the match', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const inserted = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });

      const match = await setup.freshRepositories().match.getById(inserted.id);

      expect(match.id).toBe(inserted.id);
    });

    it('rejects with MATCH_NOT_FOUND for an unknown id', async () => {
      const missing = setup
        .freshRepositories()
        .match.getById('55555555-5555-5555-5555-555555555555');

      await expect(missing).rejects.toBeInstanceOf(NotFoundError);
      await expect(missing).rejects.toMatchObject({
        errorCode: ErrorMessageCode.MATCH_NOT_FOUND,
      });
    });

    it('ignores soft-deleted matches', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const inserted = await helpers.insertMatch(
        setup.db,
        { teamId: team.id, createdBy: user.id },
        { deleted_at: new Date() },
      );

      await expect(
        setup.freshRepositories().match.getById(inserted.id),
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe('getMatchesByTeamId', () => {
    it('returns the team matches most recent first', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const older = await helpers.insertMatch(
        setup.db,
        { teamId: team.id, createdBy: user.id },
        { date: new Date('2030-01-01T18:00:00.000Z') },
      );
      const newer = await helpers.insertMatch(
        setup.db,
        { teamId: team.id, createdBy: user.id },
        { date: new Date('2030-06-01T18:00:00.000Z') },
      );

      const matches = await setup
        .freshRepositories()
        .match.getMatchesByTeamId(team.id);

      expect(matches.map((match) => match.id)).toEqual([newer.id, older.id]);
    });

    it('excludes other teams and soft-deleted matches', async () => {
      const own = await helpers.insertUserWithTeam(setup.db);
      const other = await helpers.insertUserWithTeam(setup.db);
      const visible = await helpers.insertMatch(setup.db, {
        teamId: own.team.id,
        createdBy: own.user.id,
      });
      await helpers.insertMatch(
        setup.db,
        { teamId: own.team.id, createdBy: own.user.id },
        { deleted_at: new Date() },
      );
      await helpers.insertMatch(setup.db, {
        teamId: other.team.id,
        createdBy: other.user.id,
      });

      const matches = await setup
        .freshRepositories()
        .match.getMatchesByTeamId(own.team.id);

      expect(matches.map((match) => match.id)).toEqual([visible.id]);
    });

    // Pagination used to load every row and slice the array in memory.
    it('applies limit and offset in the query', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const dates = [
        '2030-01-01T18:00:00.000Z',
        '2030-02-01T18:00:00.000Z',
        '2030-03-01T18:00:00.000Z',
      ];
      for (const date of dates) {
        await helpers.insertMatch(
          setup.db,
          { teamId: team.id, createdBy: user.id },
          { date: new Date(date) },
        );
      }
      const repositories = setup.freshRepositories();

      const firstPage = await repositories.match.getMatchesByTeamId(
        team.id,
        2,
        0,
      );
      const secondPage = await repositories.match.getMatchesByTeamId(
        team.id,
        2,
        2,
      );

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(1);
      expect(firstPage[0].date.toISOString()).toBe(dates[2]);
      expect(secondPage[0].date.toISOString()).toBe(dates[0]);
    });

    it('returns an empty list for a team with no matches', async () => {
      const { team } = await helpers.insertUserWithTeam(setup.db);

      await expect(
        setup.freshRepositories().match.getMatchesByTeamId(team.id),
      ).resolves.toEqual([]);
    });

    it('keeps the matches of different teams separate when batched together', async () => {
      const first = await helpers.insertUserWithTeam(setup.db);
      const second = await helpers.insertUserWithTeam(setup.db);
      const firstMatch = await helpers.insertMatch(setup.db, {
        teamId: first.team.id,
        createdBy: first.user.id,
      });
      const secondMatch = await helpers.insertMatch(setup.db, {
        teamId: second.team.id,
        createdBy: second.user.id,
      });
      const repositories = setup.freshRepositories();

      const [firstMatches, secondMatches] = await Promise.all([
        repositories.match.getMatchesByTeamId(first.team.id),
        repositories.match.getMatchesByTeamId(second.team.id),
      ]);

      expect(firstMatches.map((m) => m.id)).toEqual([firstMatch.id]);
      expect(secondMatches.map((m) => m.id)).toEqual([secondMatch.id]);
    });
  });

  describe('getPlayersByMatchId', () => {
    it('returns the players of the match', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const teammate = await helpers.insertUser(setup.db, {
        team_id: team.id,
      });
      const match = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });
      await helpers.insertMatchPlayer(setup.db, {
        matchId: match.id,
        userId: user.id,
      });
      await helpers.insertMatchPlayer(setup.db, {
        matchId: match.id,
        userId: teammate.id,
      });

      const players = await setup
        .freshRepositories()
        .match.getPlayersByMatchId(match.id);

      expect(players.map((player) => player.id).sort()).toEqual(
        [user.id, teammate.id].sort(),
      );
    });

    it('returns an empty list when the match has no players', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const match = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });

      await expect(
        setup.freshRepositories().match.getPlayersByMatchId(match.id),
      ).resolves.toEqual([]);
    });

    it('excludes soft-deleted players', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const removed = await helpers.insertUser(setup.db, {
        team_id: team.id,
        deleted_at: new Date(),
      });
      const match = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });
      await helpers.insertMatchPlayer(setup.db, {
        matchId: match.id,
        userId: user.id,
      });
      await helpers.insertMatchPlayer(setup.db, {
        matchId: match.id,
        userId: removed.id,
      });

      const players = await setup
        .freshRepositories()
        .match.getPlayersByMatchId(match.id);

      expect(players.map((player) => player.id)).toEqual([user.id]);
    });

    // This lookup had no batching, so listing N matches with their players ran
    // N queries.
    it('keeps the players of different matches separate when batched together', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const teammate = await helpers.insertUser(setup.db, {
        team_id: team.id,
      });
      const firstMatch = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });
      const secondMatch = await helpers.insertMatch(setup.db, {
        teamId: team.id,
        createdBy: user.id,
      });
      await helpers.insertMatchPlayer(setup.db, {
        matchId: firstMatch.id,
        userId: user.id,
      });
      await helpers.insertMatchPlayer(setup.db, {
        matchId: secondMatch.id,
        userId: teammate.id,
      });
      const repositories = setup.freshRepositories();

      const [firstPlayers, secondPlayers] = await Promise.all([
        repositories.match.getPlayersByMatchId(firstMatch.id),
        repositories.match.getPlayersByMatchId(secondMatch.id),
      ]);

      expect(firstPlayers.map((p) => p.id)).toEqual([user.id]);
      expect(secondPlayers.map((p) => p.id)).toEqual([teammate.id]);
    });
  });
});
