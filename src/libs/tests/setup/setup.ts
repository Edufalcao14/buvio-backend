import { Kysely } from 'kysely';
import { Usecases, initUsecases } from '../../../usecases';
import { DB } from '../../../repositories/database/models';
import { AppContext, AuthContext } from '../../context';
import { initGatewaysMock } from '../../../gateways/mocks';
import { Repositories, initRepositories } from '../../../repositories';
import { Config } from '../../config';
import { initEvents } from '../../events';
import { initDatabase } from '../../../repositories/database/database';

/**
 * Per-suite handle on the database that globalSetup created and migrated.
 *
 * Each call opens its own pool and its own repository set, which matters:
 * repositories carry request-scoped dataloaders, so a test that wants to
 * observe a write made by another repository instance needs a fresh one (see
 * `freshRepositories`).
 */
export const setup = async (): Promise<{
  config: Config;
  db: Kysely<DB>;
  repositories: Repositories;
  freshRepositories: () => Repositories;
  usecases: Usecases;
  context: (auth: AuthContext) => AppContext;
  onStop: () => Promise<void>;
}> => {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      'TEST_DATABASE_URL is not set. Tests must run through jest so that globalSetup starts the database container.',
    );
  }

  const config = {
    env: 'test',
    database: { url },
    graphql: { sandbox: false, maxDepth: 10, maxFields: 300 },
    rateLimit: { windowMs: 60_000, max: 1000 },
    cors: { origin: ['http://localhost'] },
  } as unknown as Config;

  const db = initDatabase(config);

  return {
    config,
    db,
    repositories: initRepositories(db),
    freshRepositories: () => initRepositories(db),
    usecases: initUsecases(),
    context: (auth: AuthContext) => setupContext(auth, config, db),
    onStop: async () => {
      await db.destroy();
    },
  };
};

export type Setup = Awaited<ReturnType<typeof setup>>;

function setupContext(
  auth: AuthContext,
  config: Config,
  db: Kysely<DB>,
): AppContext {
  return {
    config,
    gateways: initGatewaysMock(),
    repositories: initRepositories(db),
    events: initEvents(),
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    } as unknown as AppContext['logger'],
    auth,
  };
}
