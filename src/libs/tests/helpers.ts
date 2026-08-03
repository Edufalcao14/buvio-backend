import { Kysely, Selectable, sql } from 'kysely';
import {
  DB,
  MatchUsers,
  Matches,
  Teams,
  Users,
  Votes,
  VotingSessions,
} from '../../repositories/database/models';
import { dbFixtures } from '../../repositories/database/fixtures';
import { AuthContext } from '../context';

/**
 * Suites share one database, so each must start from a known state. TRUNCATE
 * ... CASCADE clears the domain tables while leaving the migration bookkeeping
 * intact.
 */
const resetDatabase = async (db: Kysely<DB>): Promise<void> => {
  await sql`
    TRUNCATE TABLE votes, voting_sessions, match_users, matches, users, teams CASCADE
  `.execute(db);
};

const authenticatedAs = (externalId: string): AuthContext => ({
  isAuthenticated: true,
  isImpersonating: false,
  isAdmin: false,
  externalId,
});

const anonymous = (): AuthContext => ({ isAuthenticated: false });

/**
 * Insert helpers that satisfy the foreign keys for you: a user needs no team, a
 * team needs a creator, a match needs a team and a creator, and so on. Tests
 * that only care about one relation should not have to build the whole graph by
 * hand.
 */
const insertUser = async (
  db: Kysely<DB>,
  overrides: Partial<Selectable<Users>> = {},
): Promise<Selectable<Users>> => {
  return db
    .insertInto('users')
    .values(dbFixtures.user.create(overrides))
    .returningAll()
    .executeTakeFirstOrThrow();
};

const insertTeam = async (
  db: Kysely<DB>,
  createdBy: string,
  overrides: Partial<Selectable<Teams>> = {},
): Promise<Selectable<Teams>> => {
  return db
    .insertInto('teams')
    .values(dbFixtures.team.create({ created_by: createdBy, ...overrides }))
    .returningAll()
    .executeTakeFirstOrThrow();
};

/** A user who owns a freshly created team, the most common starting point. */
const insertUserWithTeam = async (
  db: Kysely<DB>,
): Promise<{ user: Selectable<Users>; team: Selectable<Teams> }> => {
  const creator = await insertUser(db);
  const team = await insertTeam(db, creator.id);

  const user = await db
    .updateTable('users')
    .set({ team_id: team.id })
    .where('users.id', '=', creator.id)
    .returningAll()
    .executeTakeFirstOrThrow();

  return { user, team };
};

const insertMatch = async (
  db: Kysely<DB>,
  params: { teamId: string; createdBy: string },
  overrides: Partial<Selectable<Matches>> = {},
): Promise<Selectable<Matches>> => {
  return db
    .insertInto('matches')
    .values(
      dbFixtures.match.create({
        team_id: params.teamId,
        created_by: params.createdBy,
        ...overrides,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
};

const insertMatchPlayer = async (
  db: Kysely<DB>,
  params: { matchId: string; userId: string },
  overrides: Partial<Selectable<MatchUsers>> = {},
): Promise<Selectable<MatchUsers>> => {
  return db
    .insertInto('match_users')
    .values(
      dbFixtures.match.createPlayer({
        match_id: params.matchId,
        user_id: params.userId,
        ...overrides,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
};

const insertVotingSession = async (
  db: Kysely<DB>,
  params: { matchId: string; startedBy: string },
  overrides: Partial<Selectable<VotingSessions>> = {},
): Promise<Selectable<VotingSessions>> => {
  return db
    .insertInto('voting_sessions')
    .values(
      dbFixtures.votingSession.create({
        match_id: params.matchId,
        started_by: params.startedBy,
        ...overrides,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
};

const insertVote = async (
  db: Kysely<DB>,
  params: {
    votingSessionId: string;
    createdBy: string;
    votedForUserId: string;
  },
  overrides: Partial<Selectable<Votes>> = {},
): Promise<Selectable<Votes>> => {
  return db
    .insertInto('votes')
    .values(
      dbFixtures.vote.create({
        voting_session_id: params.votingSessionId,
        created_by: params.createdBy,
        voted_for_user_id: params.votedForUserId,
        ...overrides,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
};

export const helpers = {
  resetDatabase,
  authenticatedAs,
  anonymous,
  insertUser,
  insertTeam,
  insertUserWithTeam,
  insertMatch,
  insertMatchPlayer,
  insertVotingSession,
  insertVote,
};
