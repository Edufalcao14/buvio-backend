import { NotFoundError } from '../../../entities/errors/not-found-error';
import { ConflictError } from '../../../entities/errors/conflict-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { tests } from '../../../libs/tests';
import { Setup } from '../../../libs/tests/setup/setup';

const { helpers } = tests;

describe('team repositories', () => {
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
    it('inserts a team and returns the entity', async () => {
      const creator = await helpers.insertUser(setup.db);
      const repositories = setup.freshRepositories();

      const team = await repositories.team.create(
        'Les Bleus',
        'AB2CD',
        creator.id,
        'football',
      );

      expect(team).toMatchObject({
        name: 'Les Bleus',
        code: 'AB2CD',
        creatorId: creator.id,
        sport: 'football',
      });
      expect(team.createdAt).toBeInstanceOf(Date);
    });

    it('accepts a null sport', async () => {
      const creator = await helpers.insertUser(setup.db);

      const team = await setup
        .freshRepositories()
        .team.create('No Sport', 'NOSP1', creator.id, null);

      expect(team.sport).toBeNull();
    });

    it('reports a duplicate join code as a conflict the caller can retry', async () => {
      const creator = await helpers.insertUser(setup.db);
      const repositories = setup.freshRepositories();
      await repositories.team.create('First', 'SAME1', creator.id, null);

      const duplicate = repositories.team.create(
        'Second',
        'SAME1',
        creator.id,
        null,
      );

      await expect(duplicate).rejects.toBeInstanceOf(ConflictError);
      await expect(duplicate).rejects.toMatchObject({
        errorCode: ErrorMessageCode.TEAM_CODE_TAKEN,
      });
    });

    it('rolls back with the surrounding transaction', async () => {
      const creator = await helpers.insertUser(setup.db);
      const repositories = setup.freshRepositories();

      await expect(
        repositories.transaction.transaction().execute(async (trx) => {
          await repositories.team.create(
            'Ghost',
            'GHST1',
            creator.id,
            null,
            trx,
          );
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      await expect(
        setup.freshRepositories().team.getByCode('GHST1'),
      ).resolves.toBeNull();
    });
  });

  describe('getByCode', () => {
    it('returns the team matching the code', async () => {
      const creator = await helpers.insertUser(setup.db);
      const inserted = await helpers.insertTeam(setup.db, creator.id, {
        code: 'FIND1',
      });

      const team = await setup.freshRepositories().team.getByCode('FIND1');

      expect(team?.id).toBe(inserted.id);
    });

    it('returns null for an unknown code', async () => {
      await expect(
        setup.repositories.team.getByCode('NOPE1'),
      ).resolves.toBeNull();
    });

    it('is case sensitive', async () => {
      const creator = await helpers.insertUser(setup.db);
      await helpers.insertTeam(setup.db, creator.id, { code: 'ABCD2' });

      await expect(
        setup.freshRepositories().team.getByCode('abcd2'),
      ).resolves.toBeNull();
    });

    it('ignores soft-deleted teams', async () => {
      const creator = await helpers.insertUser(setup.db);
      await helpers.insertTeam(setup.db, creator.id, {
        code: 'DEAD1',
        deleted_at: new Date(),
      });

      await expect(
        setup.freshRepositories().team.getByCode('DEAD1'),
      ).resolves.toBeNull();
    });
  });

  describe('getById', () => {
    it('returns the team', async () => {
      const creator = await helpers.insertUser(setup.db);
      const inserted = await helpers.insertTeam(setup.db, creator.id);

      const team = await setup.freshRepositories().team.getById(inserted.id);

      expect(team.id).toBe(inserted.id);
    });

    it('rejects with TEAM_NOT_FOUND for an unknown id', async () => {
      const missing = setup
        .freshRepositories()
        .team.getById('33333333-3333-3333-3333-333333333333');

      await expect(missing).rejects.toBeInstanceOf(NotFoundError);
      await expect(missing).rejects.toMatchObject({
        errorCode: ErrorMessageCode.TEAM_NOT_FOUND,
      });
    });

    it('resolves present ids even when a sibling id in the batch is missing', async () => {
      const creator = await helpers.insertUser(setup.db);
      const inserted = await helpers.insertTeam(setup.db, creator.id);
      const repositories = setup.freshRepositories();

      const [found, missing] = await Promise.allSettled([
        repositories.team.getById(inserted.id),
        repositories.team.getById('44444444-4444-4444-4444-444444444444'),
      ]);

      expect(found.status).toBe('fulfilled');
      expect(missing.status).toBe('rejected');
    });
  });

  describe('update', () => {
    it('persists the mutable fields', async () => {
      const creator = await helpers.insertUser(setup.db);
      const inserted = await helpers.insertTeam(setup.db, creator.id);
      const repositories = setup.freshRepositories();
      const team = await repositories.team.getById(inserted.id);

      await repositories.team.update({
        ...team,
        name: 'Renamed',
        code: 'NEWC1',
        sport: 'basketball',
        updatedAt: new Date(),
      });

      const reloaded = await setup
        .freshRepositories()
        .team.getById(inserted.id);
      expect(reloaded).toMatchObject({
        name: 'Renamed',
        code: 'NEWC1',
        sport: 'basketball',
      });
    });

    it('invalidates the cached team', async () => {
      const creator = await helpers.insertUser(setup.db);
      const inserted = await helpers.insertTeam(setup.db, creator.id, {
        name: 'Before',
      });
      const repositories = setup.freshRepositories();
      const team = await repositories.team.getById(inserted.id);

      await repositories.team.update({
        ...team,
        name: 'After',
        updatedAt: new Date(),
      });

      // Same repository instance, so a stale dataloader entry would show here.
      await expect(
        repositories.team.getById(inserted.id),
      ).resolves.toMatchObject({ name: 'After' });
    });

    it('stores an empty sport as null', async () => {
      const creator = await helpers.insertUser(setup.db);
      const inserted = await helpers.insertTeam(setup.db, creator.id, {
        sport: 'football',
      });
      const repositories = setup.freshRepositories();
      const team = await repositories.team.getById(inserted.id);

      await repositories.team.update({
        ...team,
        sport: '',
        updatedAt: new Date(),
      });

      const reloaded = await setup
        .freshRepositories()
        .team.getById(inserted.id);
      expect(reloaded.sport).toBeNull();
    });
  });

  describe('delete', () => {
    it('soft-deletes the team and invalidates the cache', async () => {
      const creator = await helpers.insertUser(setup.db);
      const inserted = await helpers.insertTeam(setup.db, creator.id, {
        code: 'BYE01',
      });
      const repositories = setup.freshRepositories();
      const team = await repositories.team.getById(inserted.id);

      await repositories.team.delete(team);

      await expect(
        repositories.team.getById(inserted.id),
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(repositories.team.getByCode('BYE01')).resolves.toBeNull();
    });

    it('frees the join code for a new team', async () => {
      const creator = await helpers.insertUser(setup.db);
      const repositories = setup.freshRepositories();
      const team = await repositories.team.create(
        'First',
        'REUSE',
        creator.id,
        null,
      );

      await repositories.team.delete(team);

      const replacement = await repositories.team.create(
        'Second',
        'REUSE',
        creator.id,
        null,
      );
      expect(replacement.code).toBe('REUSE');
    });
  });
});
