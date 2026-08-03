import { tests } from '../../../libs/tests';
import { Setup } from '../../../libs/tests/setup/setup';

const { helpers } = tests;

describe('transaction repository', () => {
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

  it('commits every write when the callback resolves', async () => {
    const repositories = setup.freshRepositories();
    const creator = await helpers.insertUser(setup.db);

    const team = await repositories.transaction
      .transaction()
      .execute(async (trx) => {
        const newTeam = await repositories.team.create(
          'Committed',
          'CMT01',
          creator.id,
          null,
          trx,
        );
        await repositories.user.update(
          {
            ...(await repositories.user.getById(creator.id)),
            teamId: newTeam.id,
            updatedAt: new Date(),
          },
          trx,
        );
        return newTeam;
      });

    const fresh = setup.freshRepositories();
    await expect(fresh.team.getById(team.id)).resolves.toMatchObject({
      code: 'CMT01',
    });
    await expect(fresh.user.getById(creator.id)).resolves.toMatchObject({
      teamId: team.id,
    });
  });

  // The team-creation path depends on this: the team insert and the user's
  // team_id update must land together or not at all.
  it('rolls back every write when the callback throws', async () => {
    const repositories = setup.freshRepositories();
    const creator = await helpers.insertUser(setup.db);

    await expect(
      repositories.transaction.transaction().execute(async (trx) => {
        const newTeam = await repositories.team.create(
          'Aborted',
          'ABT01',
          creator.id,
          null,
          trx,
        );
        await repositories.user.update(
          {
            ...(await repositories.user.getById(creator.id)),
            teamId: newTeam.id,
            updatedAt: new Date(),
          },
          trx,
        );
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const fresh = setup.freshRepositories();
    await expect(fresh.team.getByCode('ABT01')).resolves.toBeNull();
    await expect(fresh.user.getById(creator.id)).resolves.toMatchObject({
      teamId: null,
    });
  });

  it('rolls back when a constraint rejects a write inside the transaction', async () => {
    const repositories = setup.freshRepositories();
    const creator = await helpers.insertUser(setup.db);
    await repositories.team.create('Existing', 'DUP01', creator.id, null);

    await expect(
      repositories.transaction.transaction().execute(async (trx) => {
        await repositories.team.create('First', 'NEW01', creator.id, null, trx);
        // Same code as the team created above: the unique index rejects it.
        await repositories.team.create(
          'Second',
          'DUP01',
          creator.id,
          null,
          trx,
        );
      }),
    ).rejects.toBeDefined();

    await expect(
      setup.freshRepositories().team.getByCode('NEW01'),
    ).resolves.toBeNull();
  });

  it('does not leak writes to other connections before it commits', async () => {
    const repositories = setup.freshRepositories();
    const creator = await helpers.insertUser(setup.db);

    await repositories.transaction.transaction().execute(async (trx) => {
      await repositories.team.create(
        'In flight',
        'FLY01',
        creator.id,
        null,
        trx,
      );

      // Reads through the pool, not the transaction, so the uncommitted row
      // must be invisible.
      await expect(
        setup.freshRepositories().team.getByCode('FLY01'),
      ).resolves.toBeNull();
    });

    await expect(
      setup.freshRepositories().team.getByCode('FLY01'),
    ).resolves.not.toBeNull();
  });
});
