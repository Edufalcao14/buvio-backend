export type UserEntity = {
  id: string;
  displayName: string;
  nickname: string | null;
  email: string;
  externalId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  teamId: string | null;
  /** R2 object key of the player's avatar, null until one is confirmed. */
  avatarKey: string | null;
};
