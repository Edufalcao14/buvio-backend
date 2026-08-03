import { UserEntity } from './user';

export type AuthPayload = {
  user: UserEntity;
  refreshToken: string;
  accessToken: string;
};
