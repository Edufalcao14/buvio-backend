import { AppContext } from '../../libs/context';
import { MeEntity, toMeEntity } from '../../entities/auth/me';
import {
  avatarKeyPrefix,
  isImageKeyUnder,
} from '../../entities/storage/image-upload';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireActiveUser } from '../shared/authorization';

/**
 * Attaches an already uploaded object to the caller as their avatar.
 *
 * This is the step that makes a picture real — the bytes went straight to the
 * bucket without passing through us, so until now nothing tied them to anyone.
 *
 * The key must sit under the caller's own prefix. Without that check any
 * authenticated player could confirm a teammate's key and wear their face, and
 * because the bucket is public they could also confirm any object they managed
 * to guess the name of.
 */
export const confirmAvatarUpload = async (
  ctx: AppContext,
  key: string,
): Promise<MeEntity> => {
  const user = await requireActiveUser(ctx);

  if (!isImageKeyUnder(avatarKeyPrefix(user.id), key)) {
    throw new BadUserInputError(ErrorMessageCode.IMAGE_KEY_INVALID);
  }

  const updated = { ...user, avatarKey: key, updatedAt: new Date() };

  await ctx.repositories.user.update(updated);

  return toMeEntity(updated);
};
