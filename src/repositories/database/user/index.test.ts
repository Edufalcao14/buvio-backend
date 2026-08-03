import { NotFoundError } from '../../../entities/errors/not-found-error';
import { BadRequestError } from '../../../entities/errors/bad-request-error';
import { ErrorMessageCode } from '../../../entities/errors/error-message-code';
import { tests } from '../../../libs/tests';
import { Setup } from '../../../libs/tests/setup/setup';

const { helpers } = tests;

describe('user repositories', () => {
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
    it('inserts a user with no team and returns the entity', async () => {
      const repositories = setup.freshRepositories();

      const user = await repositories.user.create(
        'player@buvio.test',
        'Player One',
        'external-1',
      );

      expect(user).toMatchObject({
        email: 'player@buvio.test',
        displayName: 'Player One',
        externalId: 'external-1',
        teamId: null,
        deletedAt: null,
      });
      expect(user.id).toHaveLength(36);
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('rejects a second live user with the same email', async () => {
      const repositories = setup.freshRepositories();
      await repositories.user.create('taken@buvio.test', 'First', 'external-1');

      const duplicate = repositories.user.create(
        'taken@buvio.test',
        'Second',
        'external-2',
      );

      await expect(duplicate).rejects.toBeInstanceOf(BadRequestError);
      await expect(duplicate).rejects.toMatchObject({
        errorCode: ErrorMessageCode.USER_EMAIL_ALREADY_EXISTS,
      });
    });

    it('lets a soft-deleted user free its email again', async () => {
      const repositories = setup.freshRepositories();
      const first = await repositories.user.create(
        'recycled@buvio.test',
        'First',
        'external-1',
      );
      await repositories.user.update({ ...first, deletedAt: new Date() });

      const second = await repositories.user.create(
        'recycled@buvio.test',
        'Second',
        'external-2',
      );

      expect(second.email).toBe('recycled@buvio.test');
    });

    it('rolls back with the surrounding transaction', async () => {
      const repositories = setup.freshRepositories();

      await expect(
        repositories.transaction.transaction().execute(async (trx) => {
          await repositories.user.create(
            'rolled-back@buvio.test',
            'Ghost',
            'external-ghost',
            null,
            trx,
          );
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      await expect(
        setup.freshRepositories().user.getByEmail('rolled-back@buvio.test'),
      ).resolves.toBeNull();
    });
  });

  describe('getByEmail', () => {
    it('returns null when no user matches', async () => {
      await expect(
        setup.repositories.user.getByEmail('nobody@buvio.test'),
      ).resolves.toBeNull();
    });

    it('ignores soft-deleted users', async () => {
      await helpers.insertUser(setup.db, {
        email: 'gone@buvio.test',
        deleted_at: new Date(),
      });

      await expect(
        setup.freshRepositories().user.getByEmail('gone@buvio.test'),
      ).resolves.toBeNull();
    });
  });

  describe('getByExternalId', () => {
    // The contract used to say `| null` while the implementation threw, which
    // made every caller's null-check unreachable.
    it('returns null instead of throwing when the user is unknown', async () => {
      await expect(
        setup.repositories.user.getByExternalId('unknown-external-id'),
      ).resolves.toBeNull();
    });

    it('returns the matching user', async () => {
      const inserted = await helpers.insertUser(setup.db, {
        external_id: 'external-42',
      });

      const user = await setup
        .freshRepositories()
        .user.getByExternalId('external-42');

      expect(user?.id).toBe(inserted.id);
    });

    it('ignores soft-deleted users', async () => {
      await helpers.insertUser(setup.db, {
        external_id: 'external-deleted',
        deleted_at: new Date(),
      });

      await expect(
        setup.freshRepositories().user.getByExternalId('external-deleted'),
      ).resolves.toBeNull();
    });
  });

  describe('getById', () => {
    it('returns the user', async () => {
      const inserted = await helpers.insertUser(setup.db);

      const user = await setup.freshRepositories().user.getById(inserted.id);

      expect(user.id).toBe(inserted.id);
    });

    it('rejects with USER_NOT_FOUND for an unknown id', async () => {
      const missing = setup
        .freshRepositories()
        .user.getById('11111111-1111-1111-1111-111111111111');

      await expect(missing).rejects.toBeInstanceOf(NotFoundError);
      await expect(missing).rejects.toMatchObject({
        errorCode: ErrorMessageCode.USER_NOT_FOUND,
      });
    });

    // A missing key must not poison the other keys sharing its batch.
    it('resolves present ids even when a sibling id in the batch is missing', async () => {
      const inserted = await helpers.insertUser(setup.db);
      const repositories = setup.freshRepositories();

      const [found, missing] = await Promise.allSettled([
        repositories.user.getById(inserted.id),
        repositories.user.getById('22222222-2222-2222-2222-222222222222'),
      ]);

      expect(found.status).toBe('fulfilled');
      expect(missing.status).toBe('rejected');
    });
  });

  describe('getUsersByTeamId', () => {
    it('returns every live member of the team', async () => {
      const { user: owner, team } = await helpers.insertUserWithTeam(setup.db);
      const teammate = await helpers.insertUser(setup.db, {
        team_id: team.id,
      });
      await helpers.insertUser(setup.db, {
        team_id: team.id,
        deleted_at: new Date(),
      });
      await helpers.insertUser(setup.db);

      const members = await setup
        .freshRepositories()
        .user.getUsersByTeamId(team.id);

      expect(members.map((member) => member.id).sort()).toEqual(
        [owner.id, teammate.id].sort(),
      );
    });

    it('returns an empty list for a team with no members', async () => {
      const creator = await helpers.insertUser(setup.db);
      const team = await helpers.insertTeam(setup.db, creator.id);

      await expect(
        setup.freshRepositories().user.getUsersByTeamId(team.id),
      ).resolves.toEqual([]);
    });

    it('keeps the members of different teams separate when batched together', async () => {
      const first = await helpers.insertUserWithTeam(setup.db);
      const second = await helpers.insertUserWithTeam(setup.db);
      const repositories = setup.freshRepositories();

      const [firstMembers, secondMembers] = await Promise.all([
        repositories.user.getUsersByTeamId(first.team.id),
        repositories.user.getUsersByTeamId(second.team.id),
      ]);

      expect(firstMembers.map((m) => m.id)).toEqual([first.user.id]);
      expect(secondMembers.map((m) => m.id)).toEqual([second.user.id]);
    });
  });

  describe('update', () => {
    it('persists the mutable fields', async () => {
      const inserted = await helpers.insertUser(setup.db);
      const repositories = setup.freshRepositories();
      const user = await repositories.user.getById(inserted.id);

      await repositories.user.update({
        ...user,
        displayName: 'Renamed',
        email: 'renamed@buvio.test',
        updatedAt: new Date(),
      });

      const reloaded = await setup
        .freshRepositories()
        .user.getById(inserted.id);
      expect(reloaded).toMatchObject({
        displayName: 'Renamed',
        email: 'renamed@buvio.test',
      });
    });

    it('invalidates the cached member list of both the old and the new team', async () => {
      const { user, team: oldTeam } = await helpers.insertUserWithTeam(
        setup.db,
      );
      const newTeamCreator = await helpers.insertUser(setup.db);
      const newTeam = await helpers.insertTeam(setup.db, newTeamCreator.id);

      const repositories = setup.freshRepositories();
      // Prime both loaders so the update has caches to invalidate.
      await repositories.user.getUsersByTeamId(oldTeam.id);
      await repositories.user.getUsersByTeamId(newTeam.id);

      await repositories.user.update({
        ...(await repositories.user.getById(user.id)),
        teamId: newTeam.id,
        updatedAt: new Date(),
      });

      await expect(
        repositories.user.getUsersByTeamId(oldTeam.id),
      ).resolves.toEqual([]);
      await expect(
        repositories.user.getUsersByTeamId(newTeam.id),
      ).resolves.toEqual([expect.objectContaining({ id: user.id })]);
    });

    it('soft-deletes by setting deletedAt', async () => {
      const inserted = await helpers.insertUser(setup.db);
      const repositories = setup.freshRepositories();

      await repositories.user.update({
        ...(await repositories.user.getById(inserted.id)),
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        setup.freshRepositories().user.getById(inserted.id),
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it('rolls back with the surrounding transaction', async () => {
      const inserted = await helpers.insertUser(setup.db, {
        display_name: 'Original',
      });
      const repositories = setup.freshRepositories();
      const user = await repositories.user.getById(inserted.id);

      await expect(
        repositories.transaction.transaction().execute(async (trx) => {
          await repositories.user.update(
            { ...user, displayName: 'Changed', updatedAt: new Date() },
            trx,
          );
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      const reloaded = await setup
        .freshRepositories()
        .user.getById(inserted.id);
      expect(reloaded.displayName).toBe('Original');
    });
  });
});
