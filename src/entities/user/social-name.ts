/**
 * The name to show wherever a player appears socially: voting, standings,
 * history.
 *
 * A squad calls each other by nickname, so an unset one falls back to the
 * first word of the display name rather than the whole civil name — "Jean" is
 * how the squad would address "Jean-Baptiste Moreau" anyway, and a full name
 * on a ballot reads like an administrative form.
 */
export const socialNameOf = (user: {
  displayName: string;
  nickname: string | null;
}): string => {
  const nickname = user.nickname?.trim();

  if (nickname) {
    return nickname;
  }

  // Whitespace-separated, so a hyphenated first name stays whole.
  const [firstWord] = user.displayName.trim().split(/\s+/);

  return firstWord ?? '';
};
