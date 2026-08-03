import type { ColumnType } from 'kysely';

export type Generated<T> =
  T extends ColumnType<infer S, infer I, infer U>
    ? ColumnType<S, I | undefined, U>
    : ColumnType<T, T | undefined, T>;

export type MatchType = 'AMICAL' | 'CHAMPIONNAT' | 'TOURNOI';

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type VoteClosureReason = 'ADMIN' | 'DEADLINE' | 'UNANIMOUS';

export type VoteType = 'FLOP' | 'TOP';

export interface Matches {
  created_at: Generated<Timestamp>;
  created_by: string;
  date: Timestamp;
  deleted_at: Timestamp | null;
  id: string;
  name: string;
  team_id: string;
  team2_id: string | null;
  type: Generated<MatchType>;
  updated_at: Generated<Timestamp>;
}

export interface MatchUsers {
  created_at: Generated<Timestamp>;
  deleted_at: Timestamp | null;
  id: string;
  match_id: string;
  updated_at: Generated<Timestamp>;
  user_id: string;
}

export interface Teams {
  code: string;
  created_at: Generated<Timestamp>;
  created_by: string;
  crest_key: string | null;
  deleted_at: Timestamp | null;
  id: string;
  name: string;
  sport: Generated<string | null>;
  updated_at: Generated<Timestamp>;
}

export interface Users {
  avatar_key: string | null;
  created_at: Generated<Timestamp>;
  deleted_at: Timestamp | null;
  display_name: string;
  email: string;
  external_id: string;
  id: string;
  nickname: string | null;
  team_id: string | null;
  updated_at: Generated<Timestamp>;
}

export interface Votes {
  created_at: Generated<Timestamp>;
  created_by: string;
  deleted_at: Timestamp | null;
  description: string | null;
  id: string;
  type: VoteType;
  updated_at: Generated<Timestamp>;
  voted_for_user_id: string;
  voting_session_id: string;
}

export interface VotingSessions {
  closed_at: Timestamp | null;
  closed_reason: VoteClosureReason | null;
  closing_at: Timestamp | null;
  created_at: Generated<Timestamp>;
  deleted_at: Timestamp | null;
  id: string;
  match_id: string;
  started_by: string;
  updated_at: Generated<Timestamp>;
}

export interface DB {
  match_users: MatchUsers;
  matches: Matches;
  teams: Teams;
  users: Users;
  votes: Votes;
  voting_sessions: VotingSessions;
}
