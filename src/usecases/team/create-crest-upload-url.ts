import { AppContext } from '../../libs/context';
import {
  buildImageKey,
  crestKeyPrefix,
  extensionForImageContentType,
} from '../../entities/storage/image-upload';
import { UploadTicketEntity } from '../../entities/storage/upload-ticket';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireCrestEditor } from './require-crest-editor';

/**
 * Hands the team's creator a signed PUT for a new crest object.
 *
 * The key is namespaced by team, not by the caller: a crest belongs to the
 * squad, and a later creator change must not orphan the badge.
 */
export const createCrestUploadUrl = async (
  ctx: AppContext,
  contentType: string,
): Promise<UploadTicketEntity> => {
  const team = await requireCrestEditor(ctx);

  const extension = extensionForImageContentType(contentType);

  if (!extension) {
    throw new BadUserInputError(
      ErrorMessageCode.IMAGE_CONTENT_TYPE_UNSUPPORTED,
    );
  }

  const key = buildImageKey(crestKeyPrefix(team.id), extension);

  const uploadUrl = await ctx.gateways.storage.createPresignedUpload({
    key,
    contentType: contentType.toLowerCase(),
  });

  return { uploadUrl, key };
};
