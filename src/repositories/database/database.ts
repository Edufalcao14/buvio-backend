import { Kysely, ParseJSONResultsPlugin, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { DB } from './models';
import { Config } from '../../libs/config';

export const initDatabase = (config: Config): Kysely<DB> => {
  const dialect = new PostgresDialect({
    pool: new Pool({
      connectionString: config.database.url,
    }),
  });

  const db = new Kysely<DB>({
    dialect,
    plugins: [new ParseJSONResultsPlugin()],
  });

  return db;
};
