import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Config } from '../../config';
import { migrate } from '../../../repositories/database/migrate';

declare global {
  // eslint-disable-next-line no-var
  var __BUVIO_TEST_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

/**
 * jest globalSetup: one Postgres container for the whole run, migrated once.
 *
 * Starting a container per suite costs several seconds each and multiplies with
 * every new suite, so the connection string is published through the
 * environment and each suite connects to it. Suites therefore share a database
 * and must isolate themselves by truncating (see helpers.resetDatabase), which
 * is why jest runs them serially.
 */
export default async (): Promise<void> => {
  console.log('🚀 Starting the test database container...');
  const container = await new PostgreSqlContainer('postgres:16-alpine').start();

  const url = container.getConnectionUri();
  process.env.TEST_DATABASE_URL = url;

  console.log('🛠️  Applying migrations...');
  await migrate({ database: { url } } as Config, 'up');

  globalThis.__BUVIO_TEST_CONTAINER__ = container;
};
