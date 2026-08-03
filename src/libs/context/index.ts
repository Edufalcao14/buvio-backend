import Logger from 'bunyan';
import { Config } from '../config';
import { Repositories } from '../../repositories';
import { Gateways } from '../../gateways';
import { Events } from '../events';

export type AppContext = {
  config: Config;
  logger: Logger;
  repositories: Repositories;
  gateways: Gateways;
  events: Events;
  auth: AuthContext;
};

type AuthContextUnauthenticated = {
  isAuthenticated: false;
};

type AuthContextAuthenticated = {
  isAuthenticated: true;
  externalId: string;
  /** Mirrors the `admin` custom claim on the IAM token. */
  isAdmin: boolean;
} & (AuthContextImpersonating | AuthContextNotImpersonating);

type AuthContextImpersonating = {
  isImpersonating: true;
  impersonatorExternalId: string;
};

type AuthContextNotImpersonating = {
  isImpersonating: false;
};

export type AuthContext = AuthContextAuthenticated | AuthContextUnauthenticated;
