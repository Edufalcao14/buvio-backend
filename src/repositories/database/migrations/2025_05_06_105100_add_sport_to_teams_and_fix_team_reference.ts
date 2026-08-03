import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Ajout de la colonne 'sport' dans la table 'teams'
  await db.schema
    .alterTable('teams')
    .addColumn('sport', 'varchar(255)', (col) => col.defaultTo(null))
    .execute();

  await db.schema
    .alterTable('users')
    .dropColumn('team_id')
    .addColumn('team_id', 'uuid', (col) => col.references('teams.id'))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Suppression de la colonne 'sport' dans la table 'teams'
  await db.schema.alterTable('teams').dropColumn('sport').execute();
  await db.schema
    .alterTable('users')
    .dropColumn('team_id')
    .addColumn('team_id', 'uuid', (col) => col.references('users.id'))
    .execute();
}
