import { v4 as uuidv4 } from 'uuid';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { UnauthorizedError } from '../../entities/errors/unauthorized-error';
import { tests } from '../../libs/tests';
import { Setup } from '../../libs/tests/setup/setup';
import { confirmAvatarUpload } from './confirm-avatar-upload';
import { createAvatarUploadUrl } from './create-avatar-upload-url';

const { helpers } = tests;

describe('avatar upload', () => {
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

  /** A key shaped exactly like one we would have signed for `userId`. */
  const anAvatarKeyFor = (userId: string) =>
    `avatars/${userId}/${uuidv4()}.jpg`;

  describe('createAvatarUploadUrl', () => {
    it('signs an upload under the caller’s own prefix', async () => {
      const user = await helpers.insertUser(setup.db);
      const context = setup.context(helpers.authenticatedAs(user.external_id));

      const ticket = await createAvatarUploadUrl(context, 'image/png');

      expect(ticket.key).toMatch(
        new RegExp(`^avatars/${user.id}/[0-9a-f-]{36}\\.png$`),
      );
      expect(ticket.uploadUrl).toContain(ticket.key);
    });

    it('refuses a content type that is not an image we accept', async () => {
      const user = await helpers.insertUser(setup.db);
      const context = setup.context(helpers.authenticatedAs(user.external_id));

      await expect(
        createAvatarUploadUrl(context, 'application/pdf'),
      ).rejects.toBeInstanceOf(BadUserInputError);

      // Nothing was signed: an unsupported type must never reach the bucket,
      // because the signature is the only thing pinning what gets stored.
      expect(
        context.gateways.storage.createPresignedUpload,
      ).not.toHaveBeenCalled();
    });

    it('refuses to sign anything for an anonymous caller', async () => {
      const context = setup.context(helpers.anonymous());

      await expect(
        createAvatarUploadUrl(context, 'image/png'),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe('confirmAvatarUpload', () => {
    it('attaches an image the caller uploaded for themselves', async () => {
      const user = await helpers.insertUser(setup.db);
      const context = setup.context(helpers.authenticatedAs(user.external_id));
      const { key } = await createAvatarUploadUrl(context, 'image/jpeg');

      const me = await confirmAvatarUpload(context, key);

      expect(me.avatarKey).toBe(key);

      const stored = await setup.freshRepositories().user.getById(user.id);
      expect(stored.avatarKey).toBe(key);
    });

    it('refuses a key that belongs to another player', async () => {
      const user = await helpers.insertUser(setup.db);
      const teammate = await helpers.insertUser(setup.db);
      const context = setup.context(helpers.authenticatedAs(user.external_id));

      // Whoever holds a teammate's key must not be able to wear their face.
      await expect(
        confirmAvatarUpload(context, anAvatarKeyFor(teammate.id)),
      ).rejects.toBeInstanceOf(BadUserInputError);

      const stored = await setup.freshRepositories().user.getById(user.id);
      expect(stored.avatarKey).toBeNull();
    });

    it('refuses a key that climbs out of the caller’s prefix', async () => {
      const user = await helpers.insertUser(setup.db);
      const victim = await helpers.insertUser(setup.db);
      const context = setup.context(helpers.authenticatedAs(user.external_id));

      await expect(
        confirmAvatarUpload(
          context,
          `avatars/${user.id}/../${victim.id}/${uuidv4()}.jpg`,
        ),
      ).rejects.toBeInstanceOf(BadUserInputError);
    });

    it('refuses a key under someone else’s crest prefix', async () => {
      const { user, team } = await helpers.insertUserWithTeam(setup.db);
      const context = setup.context(helpers.authenticatedAs(user.external_id));

      await expect(
        confirmAvatarUpload(context, `crests/${team.id}/${uuidv4()}.png`),
      ).rejects.toBeInstanceOf(BadUserInputError);
    });
  });
});
