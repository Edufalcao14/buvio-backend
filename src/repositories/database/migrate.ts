import * as path from 'path';
import { promises as fs } from 'fs';
import {
  Kysely,
  Migrator,
  FileMigrationProvider,
  PostgresDialect,
} from 'kysely';
import { Pool } from 'pg';
import { Config } from '../../libs/config';

/**
 * Throws on failure rather than calling process.exit: this function is also the
 * test harness's schema setup, and exiting the process there kills the whole
 * jest run instead of failing one suite. The CLI wrapper
 * (run-migrations.ts) is what turns a rejection into a non-zero exit code.
 */
export async function migrate(config: Config, command: 'up' | 'down') {
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: config.database.url,
      }),
    }),
  });

  try {
    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        // This needs to be an absolute path.
        migrationFolder: path.join(__dirname, '/migrations'),
      }),
    });

    const { error, results } = await (command === 'up'
      ? migrator.migrateToLatest()
      : migrator.migrateDown());

    results?.forEach((it) => {
      if (it.status === 'Success') {
        console.log(
          `✅ Migration "${it.migrationName}" was executed successfully`,
        );
      } else if (it.status === 'Error') {
        console.error(`❌ Failed to execute migration "${it.migrationName}"`);
      }
    });

    if (!results?.length) {
      console.log('📅 Database up-to-date: Nothing to migrate.');
    }

    if (error) {
      throw error instanceof Error ? error : new Error(String(error));
    }
  } finally {
    // Runs on the failure path too, which the previous version skipped: a
    // failed migration left the pool open and the process hanging.
    await db.destroy();
  }
}
