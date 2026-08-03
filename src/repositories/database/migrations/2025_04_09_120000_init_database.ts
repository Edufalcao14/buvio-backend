import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  //table USERS
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().notNull())
    .addColumn('display_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamp')
    .addColumn('external_id', 'varchar(255)', (col) => col.notNull())
    .execute();

  //Table TEAMS
  await db.schema
    .createTable('teams')
    .addColumn('id', 'uuid', (col) => col.primaryKey().notNull())
    .addColumn('created_by', 'uuid', (col) =>
      col.notNull().references('users.id'),
    )

    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('code', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamp')
    .execute();

  await db.schema
    .alterTable('users')
    .addColumn('team_id', 'uuid', (col) => col.references('users.id'))
    .execute();

  //Table MATCHES
  await db.schema
    .createTable('matches')
    .addColumn('id', 'uuid', (col) => col.primaryKey().notNull())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('date', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamp')
    .addColumn('created_by', 'uuid', (col) =>
      col.notNull().references('users.id'),
    )
    .addColumn('team_id', 'uuid', (col) => col.notNull().references('teams.id'))
    .addColumn('team2_id', 'uuid', (col) => col.references('teams.id'))
    .execute();

  //Table MATCH_PLAYERS
  await db.schema
    .createTable('match_users')
    .addColumn('id', 'uuid', (col) => col.primaryKey().notNull())
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id'),
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamp')
    .execute();

  //TABLE VOTING_SESSIONS
  await db.schema
    .createTable('voting_sessions')
    .addColumn('id', 'uuid', (col) => col.primaryKey().notNull())
    .addColumn('closing_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamp')
    .addColumn('started_by', 'uuid', (col) =>
      col.notNull().references('users.id'),
    )
    .addColumn('match_id', 'uuid', (col) =>
      col.notNull().references('matches.id'),
    )
    .execute();

  //TABLE VOTES
  await db.schema
    .createTable('votes')
    .addColumn('id', 'uuid', (col) => col.primaryKey().notNull())
    .addColumn('voting_session_id', 'uuid', (col) =>
      col.notNull().references('voting_sessions.id'),
    )
    .addColumn('user_id', 'uuid', (col) => col.notNull().references('users.id'))
    .addColumn('type', 'varchar', (col) =>
      col.notNull().check(sql`type IN ('TOP', 'FLOP')`),
    )
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn('deleted_at', 'timestamp')
    .addUniqueConstraint('votes_unique_constraint', [
      'user_id',
      'voting_session_id',
      'type',
      'deleted_at',
    ])
    .execute();
}
export async function down(db: Kysely<any>): Promise<void> {
  try {
    await db.schema.dropTable('votes').execute();
    await db.schema.dropTable('voting_sessions').execute();
    await db.schema.dropTable('match_users').execute();
    await db.schema.dropTable('matches').execute();
    await db.schema.alterTable('users').dropColumn('team_id').execute();
    await db.schema.dropTable('teams').execute();
    await db.schema.dropTable('users').execute();
  } catch (error) {
    console.error('Error in migration down:', error);
    throw error;
  }
}
