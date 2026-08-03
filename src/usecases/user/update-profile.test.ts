import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { socialNameOf } from '../../entities/user/social-name';
import { tests } from '../../libs/tests';
import { Setup } from '../../libs/tests/setup/setup';
import { updateProfile } from './update-profile';

const { helpers } = tests;

describe('updateProfile', () => {
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

  const aPlayer = async (nickname: string | null = null) => {
    const user = await helpers.insertUser(setup.db, {
      display_name: 'Jean-Baptiste Moreau',
      nickname,
    });

    return {
      user,
      context: setup.context(helpers.authenticatedAs(user.external_id)),
    };
  };

  const storedNicknameOf = async (id: string) =>
    (await setup.freshRepositories().user.getById(id)).nickname;

  it('trims the padding off a nickname before storing it', async () => {
    const { user, context } = await aPlayer();

    const me = await updateProfile(context, { nickname: '  JB  ' });

    expect(me.nickname).toBe('JB');
    expect(await storedNicknameOf(user.id)).toBe('JB');
  });

  it('clears the nickname when given an empty string', async () => {
    const { user, context } = await aPlayer('JB');

    const me = await updateProfile(context, { nickname: '' });

    // Cleared as null, not as "": socialNameOf must have a single spelling of
    // "unset" to fall back on.
    expect(me.nickname).toBeNull();
    expect(await storedNicknameOf(user.id)).toBeNull();
    expect(socialNameOf(me)).toBe('Jean-Baptiste');
  });

  it('treats a nickname of pure whitespace as clearing it', async () => {
    const { user, context } = await aPlayer('JB');

    await updateProfile(context, { nickname: '   ' });

    expect(await storedNicknameOf(user.id)).toBeNull();
  });

  it('leaves the nickname alone when the field is not sent', async () => {
    const { user, context } = await aPlayer('JB');

    const me = await updateProfile(context, { displayName: 'J-B Moreau' });

    expect(me.nickname).toBe('JB');
    expect(me.displayName).toBe('J-B Moreau');
    expect(await storedNicknameOf(user.id)).toBe('JB');
  });

  it('trims the display name too', async () => {
    const { context } = await aPlayer();

    const me = await updateProfile(context, { displayName: '  Marco Rossi  ' });

    expect(me.displayName).toBe('Marco Rossi');
  });

  it('refuses a nickname longer than the column allows', async () => {
    const { user, context } = await aPlayer('JB');

    await expect(
      updateProfile(context, { nickname: 'x'.repeat(41) }),
    ).rejects.toBeInstanceOf(BadUserInputError);

    expect(await storedNicknameOf(user.id)).toBe('JB');
  });

  it('refuses to blank out the display name, which has no fallback', async () => {
    const { context } = await aPlayer();

    await expect(
      updateProfile(context, { displayName: '   ' }),
    ).rejects.toBeInstanceOf(BadUserInputError);
  });
});
