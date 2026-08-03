import { v4 as uuidv4 } from 'uuid';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ForbiddenError } from '../../entities/errors/forbidden-error';
import { tests } from '../../libs/tests';
import { Setup } from '../../libs/tests/setup/setup';
import { confirmCrestUpload } from './confirm-crest-upload';
import { createCrestUploadUrl } from './create-crest-upload-url';

const { helpers } = tests;

describe('team crest upload', () => {
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

  /** A squad whose creator and one ordinary member are both to hand. */
  const aSquad = async () => {
    const { user: creator, team } = await helpers.insertUserWithTeam(setup.db);
    const member = await helpers.insertUser(setup.db, { team_id: team.id });

    return {
      creator,
      member,
      team,
      asCreator: setup.context(helpers.authenticatedAs(creator.external_id)),
      asMember: setup.context(helpers.authenticatedAs(member.external_id)),
    };
  };

  const storedCrestOf = async (teamId: string) =>
    (await setup.freshRepositories().team.getById(teamId)).crestKey;

  describe('createTeamCrestUploadUrl', () => {
    it('signs an upload under the team’s prefix for its creator', async () => {
      const { team, asCreator } = await aSquad();

      const ticket = await createCrestUploadUrl(asCreator, 'image/webp');

      expect(ticket.key).toMatch(
        new RegExp(`^crests/${team.id}/[0-9a-f-]{36}\\.webp$`),
      );
    });

    it('refuses a content type that is not an image we accept', async () => {
      const { asCreator } = await aSquad();

      await expect(
        createCrestUploadUrl(asCreator, 'application/pdf'),
      ).rejects.toBeInstanceOf(BadUserInputError);

      expect(
        asCreator.gateways.storage.createPresignedUpload,
      ).not.toHaveBeenCalled();
    });

    // Signing a URL the caller could never confirm would be a trap, so the
    // creator check happens at both ends.
    it('refuses to sign anything for a member who did not create the team', async () => {
      const { asMember } = await aSquad();

      await expect(
        createCrestUploadUrl(asMember, 'image/png'),
      ).rejects.toBeInstanceOf(ForbiddenError);
    });
  });

  describe('confirmTeamCrestUpload', () => {
    it('lets the creator replace the monogram with a real badge', async () => {
      const { team, asCreator } = await aSquad();
      const { key } = await createCrestUploadUrl(asCreator, 'image/png');

      const updated = await confirmCrestUpload(asCreator, key);

      expect(updated.crestKey).toBe(key);
      expect(await storedCrestOf(team.id)).toBe(key);
    });

    it('refuses a member who did not create the team', async () => {
      const { team, asMember } = await aSquad();

      // The crest is the whole squad's identity, so it is not any member's to
      // change.
      await expect(
        confirmCrestUpload(asMember, `crests/${team.id}/${uuidv4()}.png`),
      ).rejects.toBeInstanceOf(ForbiddenError);

      expect(await storedCrestOf(team.id)).toBeNull();
    });

    it('refuses a key belonging to another team', async () => {
      const { team, asCreator } = await aSquad();
      const { team: otherTeam } = await helpers.insertUserWithTeam(setup.db);

      await expect(
        confirmCrestUpload(asCreator, `crests/${otherTeam.id}/${uuidv4()}.png`),
      ).rejects.toBeInstanceOf(BadUserInputError);

      expect(await storedCrestOf(team.id)).toBeNull();
    });

    it('refuses a key that points at a player’s avatar', async () => {
      const { team, creator, asCreator } = await aSquad();

      await expect(
        confirmCrestUpload(asCreator, `avatars/${creator.id}/${uuidv4()}.png`),
      ).rejects.toBeInstanceOf(BadUserInputError);

      expect(await storedCrestOf(team.id)).toBeNull();
    });
  });
});
