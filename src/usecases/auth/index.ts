import { refreshToken } from './refresh-token';
import { getMe } from './get-me';
import { signIn } from './sign-in';

export const initAuthUsecases = () => {
  return {
    signIn,
    refreshToken,
    getMe,
  };
};

export type AuthUsecases = ReturnType<typeof initAuthUsecases>;
