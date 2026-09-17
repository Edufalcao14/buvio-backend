import { UnauthorizedError } from '../../entities/errors/unauthorized-error';
import { tests } from '../../libs/tests';
import { Setup } from '../../libs/tests/setup/setup';
import { deleteAccount } from './delete-account';

const { helpers } = tests;

describe('deleteAccount', () => {
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

  const aPlayer = async () => {
    const { user: creator, team } = await helpers.insertUserWithTeam(setup.db);

    const user = await setup.db
      .updateTable('users')
      .set({
        display_name: 'Jean-Baptiste Moreau',
        nickname: 'JB',
        email: 'jb@buvio.test',
      })
      .where('users.id', '=', creator.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      user,
      team,
      context: setup.context(helpers.authenticatedAs(user.external_id)),
    };
  };

  it('erases the person and keeps the row', async () => {
    const { user, context } = await aPlayer();

    await deleteAccount(context);

    // Read straight from the database: every repository read filters
    // soft-deleted users out, which is the point.
    const row = await setup.db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', user.id)
      .executeTakeFirstOrThrow();

    expect(row.deleted_at).not.toBeNull();
    expect(row.display_name).toBe('Joueur supprimé');
    expect(row.nickname).toBeNull();
    expect(row.avatar_key).toBeNull();
    expect(row.email).not.toContain('jb@buvio.test');
    // Out of the squad, so the roster and the standings stop showing them.
    expect(row.team_id).toBeNull();
  });

  it('releases the email address for a future sign-up', async () => {
    const { context } = await aPlayer();

    await deleteAccount(context);

    const stillTaken = await setup
      .freshRepositories()
      .user.getByEmail('jb@buvio.test');

    expect(stillTaken).toBeFalsy();
  });

  it('invalidates every token by deleting the identity account', async () => {
    const { user, context } = await aPlayer();

    await deleteAccount(context);

    expect(context.gateways.iam.deleteUser).toHaveBeenCalledWith(
      user.external_id,
    );
  });

  it('refuses an unauthenticated caller', async () => {
    const context = setup.context(helpers.anonymous());

    await expect(deleteAccount(context)).rejects.toThrow(UnauthorizedError);
  });

  it('refuses a caller whose account is already deleted', async () => {
    const { context } = await aPlayer();

    await deleteAccount(context);

    // The token is still in hand, but the row behind it is gone.
    await expect(deleteAccount(context)).rejects.toThrow(UnauthorizedError);
  });
});
