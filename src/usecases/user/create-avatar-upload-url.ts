import { AppContext } from '../../libs/context';
import {
  avatarKeyPrefix,
  buildImageKey,
  extensionForImageContentType,
} from '../../entities/storage/image-upload';
import { UploadTicketEntity } from '../../entities/storage/upload-ticket';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireActiveUser } from '../shared/authorization';

/**
 * Hands the caller a signed PUT for a brand new avatar object.
 *
 * The key is minted here, never taken from the client: it is what confirm
 * later checks ownership against, so a caller who could name their own key
 * could name one under someone else's prefix and hand it to confirm.
 *
 * Nothing is written to the player's row at this point — the picture only
 * becomes theirs at confirm, once the bytes exist.
 */
export const createAvatarUploadUrl = async (
  ctx: AppContext,
  contentType: string,
): Promise<UploadTicketEntity> => {
  const user = await requireActiveUser(ctx);

  const extension = extensionForImageContentType(contentType);

  // Refused before a URL exists rather than at upload time: the signature pins
  // the content type, so an unsupported one must never get signed at all.
  if (!extension) {
    throw new BadUserInputError(
      ErrorMessageCode.IMAGE_CONTENT_TYPE_UNSUPPORTED,
    );
  }

  const key = buildImageKey(avatarKeyPrefix(user.id), extension);

  const uploadUrl = await ctx.gateways.storage.createPresignedUpload({
    key,
    contentType: contentType.toLowerCase(),
  });

  return { uploadUrl, key };
};
