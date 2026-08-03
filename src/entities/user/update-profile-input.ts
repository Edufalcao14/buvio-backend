/**
 * Both fields are optional and an omitted one is left untouched, which is why
 * `null` is a meaningful value only for the nickname: it clears it and puts the
 * player back on the display-name fallback.
 */
export type UpdateProfileInput = {
  displayName?: string | null;
  nickname?: string | null;
};
