import { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create the MatchType enum type
  await db.schema.createType('vote_type').asEnum(['FLOP', 'TOP']).execute();

  await db.schema
    .alterTable('votes')
    .addColumn('voted_for_user_id', 'uuid', (col) =>
      col.references('users.id').notNull(),
    )
    .execute();

  await db.schema
    .alterTable('votes')
    .addColumn('description', 'varchar(256)')
    .execute();

  await db.schema
    .alterTable('votes')
    .dropColumn('user_id')
    .addColumn('created_by', 'uuid', (col) =>
      col.references('users.id').notNull(),
    )
    .execute();

  // Modify the type column to use the new enum type
  await db.schema
    .alterTable('votes')
    .dropColumn('type')
    .addColumn('type', sql`vote_type`, (col) => col.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Revert the type column back to its original state
  await db.schema
    .alterTable('votes')
    .dropColumn('type')
    .addColumn('type', 'varchar', (col) =>
      col.notNull().check(sql`type IN ('TOP', 'FLOP')`),
    )
    .execute();

  // Revert created_by back to user_id
  await db.schema
    .alterTable('votes')
    .dropColumn('created_by')
    .addColumn('user_id', 'uuid', (col) => col.references('users.id').notNull())
    .execute();

  // Drop the description column
  await db.schema.alterTable('votes').dropColumn('description').execute();

  // Drop the voted_for_user_id column
  await db.schema.alterTable('votes').dropColumn('voted_for_user_id').execute();

  // Drop the vote_type enum type
  await db.schema.dropType('vote_type').execute();
}
