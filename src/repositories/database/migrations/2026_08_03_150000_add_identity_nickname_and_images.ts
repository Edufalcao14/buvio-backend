import { Kysely } from 'kysely';

/**
 * Gives players a nickname and an avatar, and teams a crest.
 *
 * All three are nullable on purpose. A nickname is optional by definition — it
 * falls back to the first word of the display name — and the two image columns
 * hold an R2 object key that only exists once the client has actually uploaded
 * the bytes, so every row starts without one.
 *
 * The columns store the key, not a URL: the bucket's public host is
 * configuration and would otherwise be baked into every row, unchangeable
 * without a data migration.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('nickname', 'varchar(40)')
    .execute();

  await db.schema
    .alterTable('users')
    .addColumn('avatar_key', 'varchar(512)')
    .execute();

  await db.schema
    .alterTable('teams')
    .addColumn('crest_key', 'varchar(512)')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('teams').dropColumn('crest_key').execute();
  await db.schema.alterTable('users').dropColumn('avatar_key').execute();
  await db.schema.alterTable('users').dropColumn('nickname').execute();
}
