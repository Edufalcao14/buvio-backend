export type MeEntity = {
  id: string;
  displayName: string;
  nickname: string | null;
  email: string;
  externalId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  teamId: string | null;
  avatarKey: string | null;
};

/**
 * The caller's own view of themselves.
 *
 * `Me` is a separate type from `User` because it is the only place a player
 * sees their own private fields, so every usecase that answers with the caller
 * — reading the profile or writing it — narrows through here rather than
 * returning the user row and letting the schema decide what leaks.
 */
export const toMeEntity = (user: {
  id: string;
  displayName: string;
  nickname: string | null;
  email: string;
  externalId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  teamId: string | null;
  avatarKey: string | null;
}): MeEntity => ({
  id: user.id,
  displayName: user.displayName,
  nickname: user.nickname,
  email: user.email,
  externalId: user.externalId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  deletedAt: user.deletedAt,
  teamId: user.teamId,
  avatarKey: user.avatarKey,
});
