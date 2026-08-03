import Joi from 'joi';
import { AppContext } from '../../libs/context';
import { MeEntity, toMeEntity } from '../../entities/auth/me';
import { UpdateProfileInput } from '../../entities/user/update-profile-input';
import { requireActiveUser } from '../shared/authorization';
import { assertValid } from '../shared/validation';

/** Matches the varchar(40) the column was created with. */
const MAX_NICKNAME_LENGTH = 40;

const schema = Joi.object<UpdateProfileInput>({
  displayName: Joi.string().trim().min(1).max(255).optional(),
  // The empty string is allowed because it is how a client clears a nickname:
  // a text field the player emptied sends "", not null.
  nickname: Joi.string()
    .trim()
    .max(MAX_NICKNAME_LENGTH)
    .allow('', null)
    .optional(),
});

/**
 * Edits the caller's own profile. There is no user id argument on purpose —
 * a player only ever edits themselves.
 *
 * An omitted field is left untouched, which is what separates "the client did
 * not send a nickname" from "the player cleared their nickname": only the
 * second puts them back on the display-name fallback.
 */
export const updateProfile = async (
  ctx: AppContext,
  input: UpdateProfileInput,
): Promise<MeEntity> => {
  assertValid(schema, input);

  const user = await requireActiveUser(ctx);

  // Joi converts on validation but assertValid keeps only the verdict, so the
  // trimming that actually reaches the database happens here.
  const nickname =
    input.nickname === undefined
      ? user.nickname
      : normalizeNickname(input.nickname);

  const displayName =
    input.displayName === undefined || input.displayName === null
      ? user.displayName
      : input.displayName.trim();

  const updated = { ...user, nickname, displayName, updatedAt: new Date() };

  await ctx.repositories.user.update(updated);

  return toMeEntity(updated);
};

/**
 * Anything blank becomes null rather than an empty string: a stored "" would
 * make the display-name fallback in socialNameOf depend on which of two
 * spellings of "unset" the row happens to hold.
 */
const normalizeNickname = (nickname: string | null): string | null => {
  if (nickname === null) {
    return null;
  }

  return nickname.trim() || null;
};
