import { AppContext } from '../../libs/context';
import { TeamEntity } from '../../entities/team/team';
import {
  crestKeyPrefix,
  isImageKeyUnder,
} from '../../entities/storage/image-upload';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireCrestEditor } from './require-crest-editor';

/**
 * Attaches an already uploaded object to the team as its crest, replacing the
 * monogram it showed until now.
 *
 * The key must sit under this team's own prefix: without that check the
 * creator of any team could point their badge at another squad's object, or at
 * a player's avatar.
 */
export const confirmCrestUpload = async (
  ctx: AppContext,
  key: string,
): Promise<TeamEntity> => {
  const team = await requireCrestEditor(ctx);

  if (!isImageKeyUnder(crestKeyPrefix(team.id), key)) {
    throw new BadUserInputError(ErrorMessageCode.IMAGE_KEY_INVALID);
  }

  const updated = { ...team, crestKey: key, updatedAt: new Date() };

  await ctx.repositories.team.update(updated);

  return updated;
};
