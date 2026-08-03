import admin from 'firebase-admin';
import * as client from 'firebase/app';
import * as clientAuth from 'firebase/auth';
import { Config } from '../../libs/config';
import { UnknownError } from '../../entities/errors/unknown-error';
import { BadRequestError } from '../../entities/errors/bad-request-error';
import { AuthTokensEntity } from '../../entities/auth/auth-tokens';
import { BusinessError } from '../../entities/errors/business-error';
import { UnauthorizedError } from '../../entities/errors/unauthorized-error';
import { ForbiddenError } from '../../entities/errors/forbidden-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { AuthContext } from '../../libs/context';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';

type ImpersonateClaims =
  | {
      is_impersonating: true;
      target_user_id: string;
    }
  | {
      is_impersonating: false;
      target_user_id: null;
    };

type AdminClaim = {
  admin?: boolean;
};

export const initIAMGateway = (config: Config) => {
  // Init firebase admin
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: config.firebase.projectId,
      clientEmail: config.firebase.credentials.clientEmail,
      privateKey: config.firebase.credentials.privateKey,
    }),
  });

  // Init firebase client
  const clientApp = client.initializeApp({
    apiKey: config.firebase.client.apiKey,
    authDomain: config.firebase.client.authDomain,
    projectId: config.firebase.projectId,
    storageBucket: config.firebase.client.storageBucket,
    messagingSenderId: config.firebase.client.messagingSenderId,
    appId: config.firebase.client.appId,
  });

  const createUser = async (
    email: string,
    password: string,
    displayName?: string,
  ): Promise<string> => {
    try {
      const user = await admin.auth().createUser({
        email: email,
        password: password,
        emailVerified: true,
        displayName,
      });

      return user.uid;
    } catch (err: any) {
      if (err.code === 'auth/email-already-exists') {
        throw new BadRequestError(
          ErrorMessageCode.USER_EMAIL_ALREADY_EXISTS,
          undefined,
          err.stack,
        );
      }
      throw new UnknownError('iam.createUser', err.stack);
    }
  };

  /**
   * Used to roll back an identity account whose database row could not be
   * written; without it a failed signup leaves an account that can never be
   * re-created and never signed into.
   */
  const deleteUser = async (externalId: string): Promise<void> => {
    try {
      await admin.auth().deleteUser(externalId);
    } catch (err: any) {
      throw new UnknownError('iam.deleteUser', err.stack);
    }
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthTokensEntity> => {
    try {
      const auth = clientAuth.getAuth(clientApp);
      const { user } = await clientAuth.signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      if (!user.emailVerified) {
        throw new UnauthorizedError(ErrorMessageCode.AUTH_EMAIL_NOT_VERIFIED);
      }

      const { token, expirationTime } = await user.getIdTokenResult();
      return {
        accessToken: token,
        refreshToken: user.refreshToken,
        expiredAt: new Date(expirationTime),
      };
    } catch (err: any) {
      if (err instanceof BusinessError) {
        throw err;
      }
      // One code for every credential failure: a distinct code or status per
      // case (unknown email vs wrong password) is an enumeration oracle. The
      // email is deliberately not attached — details reach the client.
      throw new UnauthorizedError(
        ErrorMessageCode.AUTH_INVALID_CREDENTIALS,
        undefined,
        err.stack,
      );
    }
  };

  const getAuthAndValidateToken = async (
    accessToken: string,
  ): Promise<AuthContext> => {
    try {
      const decodedToken = (await admin
        .auth()
        .verifyIdToken(accessToken)) as DecodedIdToken &
        ImpersonateClaims &
        AdminClaim;

      const isAdmin = decodedToken.admin === true;

      if (decodedToken.is_impersonating) {
        return {
          isAuthenticated: true,
          isImpersonating: true,
          isAdmin,
          externalId: decodedToken.target_user_id,
          impersonatorExternalId: decodedToken.uid,
        };
      }

      return {
        isAuthenticated: true,
        isImpersonating: false,
        isAdmin,
        externalId: decodedToken.uid,
      };
    } catch (err: any) {
      switch (err.code) {
        case 'auth/id-token-expired':
          throw new UnauthorizedError(
            ErrorMessageCode.AUTH_TOKEN_EXPIRED,
            undefined,
            err.stack,
          );
        case 'auth/id-token-revoked':
          throw new UnauthorizedError(
            ErrorMessageCode.AUTH_TOKEN_REVOKED,
            undefined,
            err.stack,
          );
        default:
          throw new UnauthorizedError(
            ErrorMessageCode.AUTH_TOKEN_INVALID,
            undefined,
            err.stack,
          );
      }
    }
  };

  const _refreshToken = async (
    refreshToken: string,
  ): Promise<AuthTokensEntity> => {
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', refreshToken);

    const response = await fetch(
      `https://securetoken.googleapis.com/v1/token?key=${config.firebase.client.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      },
    );
    if (!response.ok) {
      const { error } = await response.json();
      switch (error?.message) {
        case 'MISSING_REFRESH_TOKEN':
          throw new BadRequestError(
            ErrorMessageCode.AUTH_REFRESH_TOKEN_MISSING,
          );
        case 'USER_DISABLED':
          throw new UnauthorizedError(ErrorMessageCode.AUTH_ACCOUNT_DISABLED);
        case 'TOKEN_EXPIRED':
        case 'INVALID_REFRESH_TOKEN':
        case 'USER_NOT_FOUND':
        case 'INVALID_GRANT':
        case 'INVALID_GRANT_TYPE':
          throw new UnauthorizedError(
            ErrorMessageCode.AUTH_REFRESH_TOKEN_INVALID,
          );
        default:
          throw new UnknownError('iam.refreshToken');
      }
    }

    const data = await response.json();
    const { id_token, refresh_token, expires_in } = data;

    const expiredAt = new Date();
    expiredAt.setSeconds(expiredAt.getSeconds() + Number(expires_in));

    return {
      accessToken: id_token,
      refreshToken: refresh_token,
      expiredAt,
    };
  };

  const impersonateUser = async (
    auth: AuthContext,
    refreshToken: string,
    userId: string,
  ): Promise<AuthTokensEntity> => {
    if (!auth.isAuthenticated) {
      throw new UnauthorizedError(ErrorMessageCode.AUTH_REQUIRED);
    }

    // Without this check any authenticated caller could mint a token that the
    // whole application treats as an arbitrary victim: full account takeover.
    if (!auth.isAdmin) {
      throw new ForbiddenError(ErrorMessageCode.AUTH_ADMIN_REQUIRED);
    }

    if (auth.isImpersonating) {
      throw new ForbiddenError(ErrorMessageCode.AUTH_ALREADY_IMPERSONATING);
    }

    try {
      const claims: ImpersonateClaims & AdminClaim = {
        is_impersonating: true,
        target_user_id: userId,
        admin: true,
      };
      await admin.auth().setCustomUserClaims(auth.externalId, claims);
      return _refreshToken(refreshToken);
    } catch (err: any) {
      if (err instanceof BusinessError) {
        throw err;
      }
      throw new UnknownError('iam.impersonateUser', err.stack);
    }
  };

  const stopImpersonatingUser = async (
    auth: AuthContext,
    refreshToken: string,
  ): Promise<AuthTokensEntity> => {
    if (!auth.isAuthenticated) {
      throw new UnauthorizedError(ErrorMessageCode.AUTH_REQUIRED);
    }
    if (!auth.isImpersonating) {
      throw new ForbiddenError(ErrorMessageCode.AUTH_NOT_IMPERSONATING);
    }

    try {
      const claims: ImpersonateClaims & AdminClaim = {
        is_impersonating: false,
        target_user_id: null,
        admin: auth.isAdmin,
      };
      await admin
        .auth()
        .setCustomUserClaims(auth.impersonatorExternalId, claims);
      return _refreshToken(refreshToken);
    } catch (err: any) {
      if (err instanceof BusinessError) {
        throw err;
      }
      throw new UnknownError('iam.stopImpersonatingUser', err.stack);
    }
  };

  return {
    createUser,
    deleteUser,
    signIn,
    getAuthAndValidateToken,
    refreshToken: _refreshToken,
    impersonateUser,
    stopImpersonatingUser,
  };
};

export type IAMGateway = ReturnType<typeof initIAMGateway>;
