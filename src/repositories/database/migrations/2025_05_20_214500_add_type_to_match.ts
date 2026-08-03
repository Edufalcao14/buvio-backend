import { Kysely } from 'kysely';
import { sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create the MatchType enum type
  await db.schema
    .createType('match_type')
    .asEnum(['AMICAL', 'TOURNOI', 'CHAMPIONNAT'])
    .execute();

  // Add the type column with default value and NOT NULL constraint
  await db.schema
    .alterTable('matches')
    .addColumn('type', sql`match_type`, (col) =>
      col.defaultTo(sql`'AMICAL'::match_type`).notNull(),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop the type column
  await db.schema.alterTable('matches').dropColumn('type').execute();

  // Drop the enum type
  await db.schema.dropType('match_type').execute();
}
