import { sql } from 'kysely';
import admin from 'firebase-admin';
import { assertConfigIsValid, config } from '../src/libs/config';
import { initDatabase } from '../src/repositories/database/database';
import { initRepositories } from '../src/repositories';
import { initGateways } from '../src/gateways';
import { MatchType } from '../src/entities/match/match-type';
import { VoteType } from '../src/entities/vote/vote-type';

/**
 * Development seed: a team with an owner, teammates, matches and votes, plus the
 * matching identity-provider accounts so the seeded users can actually sign in.
 *
 * Re-runnable: it deletes anything it created before (identified by the
 * SEED_EMAIL_DOMAIN) and starts over.
 *
 *   bun run db:seed
 */

const SEED_EMAIL_DOMAIN = 'buvio.test';
const SEED_PASSWORD = 'BuvioDemo2026!';

const TEAM = { name: 'Les Aigles de Lisbonne', sport: 'football' };

const OWNER = {
  displayName: 'Eduardo Sampaio',
  email: `owner@${SEED_EMAIL_DOMAIN}`,
};

const TEAMMATES = [
  { displayName: 'Camille Dubois', email: `camille@${SEED_EMAIL_DOMAIN}` },
  { displayName: 'Hugo Martins', email: `hugo@${SEED_EMAIL_DOMAIN}` },
  { displayName: 'Inès Lefèvre', email: `ines@${SEED_EMAIL_DOMAIN}` },
  { displayName: 'Rafael Costa', email: `rafael@${SEED_EMAIL_DOMAIN}` },
  { displayName: 'Léa Moreau', email: `lea@${SEED_EMAIL_DOMAIN}` },
  { displayName: 'Tomás Almeida', email: `tomas@${SEED_EMAIL_DOMAIN}` },
  { displayName: 'Sofia Ribeiro', email: `sofia@${SEED_EMAIL_DOMAIN}` },
];

const daysFromNow = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(20, 0, 0, 0);
  return date;
};

const main = async () => {
  assertConfigIsValid(config);
  assertNotProduction();

  const db = initDatabase(config);
  const repositories = initRepositories(db);
  const gateways = initGateways(config);

  try {
    await removePreviousSeed(db);

    console.log('👤 Creating identity accounts and users...');
    const owner = await createUser(repositories, gateways, OWNER);
    const teammates = [];
    for (const teammate of TEAMMATES) {
      teammates.push(await createUser(repositories, gateways, teammate));
    }

    console.log('🏳️  Creating the team...');
    const team = await repositories.team.create(
      TEAM.name,
      await freeTeamCode(repositories),
      owner.id,
      TEAM.sport,
    );

    for (const member of [owner, ...teammates]) {
      await repositories.user.update({
        ...member,
        teamId: team.id,
        updatedAt: new Date(),
      });
    }

    const squad = [owner, ...teammates];

    console.log('⚽ Creating matches...');
    const matches = [
      {
        entity: await repositories.match.create(
          'Aigles vs Benfica B',
          daysFromNow(-14),
          MatchType.CHAMPIONNAT,
          owner.id,
          team.id,
        ),
        label: 'played, voting closed',
      },
      {
        entity: await repositories.match.create(
          'Aigles vs Sporting C',
          daysFromNow(-3),
          MatchType.CHAMPIONNAT,
          owner.id,
          team.id,
        ),
        label: 'played, voting open',
      },
      {
        entity: await repositories.match.create(
          'Tournoi de Cascais',
          daysFromNow(9),
          MatchType.TOURNOI,
          owner.id,
          team.id,
        ),
        label: 'upcoming, no session yet',
      },
    ];

    for (const match of matches) {
      for (const player of squad) {
        await repositories.match.addPlayer(player.id, match.entity.id);
      }
    }

    console.log('🗳️  Creating voting sessions and votes...');

    // Closed session: the votes have to be cast while it is open, because the
    // repository only inserts into an open session by design. The closing date
    // is moved into the past afterwards.
    const closedSession = await repositories.votingSession.create(
      matches[0].entity.id,
      daysFromNow(1),
      owner.id,
    );
    await castVotes(repositories, closedSession.id, squad, 5);
    await db
      .updateTable('voting_sessions')
      .set({ closing_at: daysFromNow(-12) })
      .where('id', '=', closedSession.id)
      .execute();

    // Open session, closing in two days.
    const openSession = await repositories.votingSession.create(
      matches[1].entity.id,
      daysFromNow(2),
      owner.id,
    );
    // Only part of the squad has voted, so the owner still has something to do.
    await castVotes(repositories, openSession.id, squad, 3);

    report(team, owner, teammates, matches);
  } finally {
    await db.destroy();
  }
};

/**
 * Cast one TOP and one FLOP for the first `voterCount` members, each picking two
 * different teammates so no vote violates the domain rules.
 */
const castVotes = async (
  repositories: ReturnType<typeof initRepositories>,
  votingSessionId: string,
  squad: { id: string }[],
  voterCount: number,
) => {
  for (let i = 0; i < voterCount; i++) {
    const voter = squad[i];
    const top = squad[(i + 1) % squad.length];
    const flop = squad[(i + 2) % squad.length];

    await repositories.vote.create(
      votingSessionId,
      voter.id,
      top.id,
      'Excellent match, toujours au bon endroit.',
      VoteType.TOP,
    );
    await repositories.vote.create(
      votingSessionId,
      voter.id,
      flop.id,
      'Journée difficile, ça arrive.',
      VoteType.FLOP,
    );
  }
};

const createUser = async (
  repositories: ReturnType<typeof initRepositories>,
  gateways: ReturnType<typeof initGateways>,
  input: { displayName: string; email: string },
) => {
  const externalId = await gateways.iam.createUser(
    input.email,
    SEED_PASSWORD,
    input.displayName,
  );

  return repositories.user.create(input.email, input.displayName, externalId);
};

const freeTeamCode = async (
  repositories: ReturnType<typeof initRepositories>,
): Promise<string> => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = Array.from({ length: 5 })
      .map(() => characters[Math.floor(Math.random() * characters.length)])
      .join('');

    if (!(await repositories.team.getByCode(code))) {
      return code;
    }
  }

  throw new Error('Could not find a free team code');
};

/**
 * Deletes everything a previous run created, in both the database and the
 * identity provider, so the seed is re-runnable.
 */
const removePreviousSeed = async (
  db: ReturnType<typeof initDatabase>,
): Promise<void> => {
  const existing = await db
    .selectFrom('users')
    .select(['id', 'external_id', 'team_id'])
    .where('users.email', 'like', `%@${SEED_EMAIL_DOMAIN}`)
    .execute();

  if (existing.length === 0) {
    return;
  }

  console.log(`🧹 Removing ${existing.length} users from a previous seed...`);

  const teamIds = [
    ...new Set(
      existing.map((u) => u.team_id).filter((id): id is string => !!id),
    ),
  ];
  const userIds = existing.map((user) => user.id);

  // Foreign keys dictate the order.
  if (teamIds.length > 0) {
    const matchIds = (
      await db
        .selectFrom('matches')
        .select('id')
        .where('matches.team_id', 'in', teamIds)
        .execute()
    ).map((match) => match.id);

    if (matchIds.length > 0) {
      const sessionIds = (
        await db
          .selectFrom('voting_sessions')
          .select('id')
          .where('voting_sessions.match_id', 'in', matchIds)
          .execute()
      ).map((session) => session.id);

      if (sessionIds.length > 0) {
        await db
          .deleteFrom('votes')
          .where('votes.voting_session_id', 'in', sessionIds)
          .execute();
        await db
          .deleteFrom('voting_sessions')
          .where('voting_sessions.id', 'in', sessionIds)
          .execute();
      }

      await db
        .deleteFrom('match_users')
        .where('match_users.match_id', 'in', matchIds)
        .execute();
      await db
        .deleteFrom('matches')
        .where('matches.id', 'in', matchIds)
        .execute();
    }
  }

  await db
    .updateTable('users')
    .set({ team_id: null })
    .where('users.id', 'in', userIds)
    .execute();

  if (teamIds.length > 0) {
    await db.deleteFrom('teams').where('teams.id', 'in', teamIds).execute();
  }

  await db.deleteFrom('users').where('users.id', 'in', userIds).execute();

  const externalIds = existing
    .map((user) => user.external_id)
    .filter((id): id is string => !!id);

  if (externalIds.length > 0) {
    await admin.auth().deleteUsers(externalIds);
  }
};

/**
 * A seed deletes data and creates accounts with a published password. Refuse to
 * run anywhere that could be real.
 */
const assertNotProduction = (): void => {
  const url = config.database.url ?? '';
  const isLocalDatabase =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('@database:');

  if (config.env === 'production' || !isLocalDatabase) {
    throw new Error(
      `Refusing to seed: NODE_ENV=${config.env} and the database is not local. ` +
        'This script deletes rows and creates accounts with a well-known password.',
    );
  }
};

const report = (
  team: { name: string; code: string },
  owner: { displayName: string; email: string; id: string },
  teammates: { displayName: string; email: string }[],
  matches: { entity: { name: string }; label: string }[],
) => {
  const line = '─'.repeat(64);
  console.log(`\n${line}`);
  console.log('✅ Seed complete\n');
  console.log(`Team ......... ${team.name}`);
  console.log(`Join code .... ${team.code}`);
  console.log(
    `Members ...... ${teammates.length + 1} (owner + ${teammates.length})`,
  );
  console.log(`\nSign in as the team owner:`);
  console.log(`  email ...... ${owner.email}`);
  console.log(`  password ... ${SEED_PASSWORD}`);
  console.log(`\nTeammates (same password):`);
  for (const teammate of teammates) {
    console.log(`  ${teammate.email.padEnd(28)} ${teammate.displayName}`);
  }
  console.log(`\nMatches:`);
  for (const match of matches) {
    console.log(`  ${match.entity.name.padEnd(28)} ${match.label}`);
  }
  console.log(line);
};

main().catch((error) => {
  console.error('Seed failed:', error?.message ?? error);
  process.exit(1);
});
