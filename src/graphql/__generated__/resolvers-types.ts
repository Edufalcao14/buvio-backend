import {
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLScalarTypeConfig,
} from 'graphql';
import { UserEntity } from '../../entities/user/user';
import { MeEntity } from '../../entities/auth/me';
import { AuthTokensEntity } from '../../entities/auth/auth-tokens';
import { TeamEntity } from '../../entities/team/team';
import { MatchEntity } from '../../entities/match/match';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import { VoteEntity } from '../../entities/vote/vote';
import { UploadTicketEntity } from '../../entities/storage/upload-ticket';
import { AppContext } from '../../libs/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never;
    };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
  Email: { input: any; output: any };
};

/** Complete authentication response containing tokens and user data */
export type AuthPayload = {
  __typename?: 'AuthPayload';
  /** JWT token for authorizing API requests */
  accessToken: Scalars['String']['output'];
  /** Token used to obtain new access tokens without re-authentication */
  refreshToken: Scalars['String']['output'];
  /** Complete user profile information for the authenticated user */
  user: User;
};

/** Authentication token set with expiration information */
export type AuthTokens = {
  __typename?: 'AuthTokens';
  /** JWT token for authorizing API requests */
  accessToken: Scalars['String']['output'];
  /** Precise date and time when the tokens will expire */
  expiredAt: Scalars['DateTime']['output'];
  /** Token used to obtain new access tokens without re-authentication */
  refreshToken: Scalars['String']['output'];
};

/** How far one player has got with their ballot in an open session */
export type BallotProgress = {
  __typename?: 'BallotProgress';
  hasFlop: Scalars['Boolean']['output'];
  hasTop: Scalars['Boolean']['output'];
  isComplete: Scalars['Boolean']['output'];
  player: User;
};

/** Match */
export type Match = {
  __typename?: 'Match';
  /** Timestamp when the match was first created */
  createdAt: Scalars['DateTime']['output'];
  /** User who created the match */
  creator: User;
  /** The team's code that enables users to join the team */
  date: Scalars['DateTime']['output'];
  /** Timestamp when the match was soft-deleted */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Unique internal identifier for the match */
  id: Scalars['ID']['output'];
  /** Match's display name shown across the application */
  name: Scalars['String']['output'];
  /** List of players participating in the match */
  players: Array<User>;
  /** Team participating in the match */
  team: Team;
  /** Type of the match */
  type: MatchType;
  /** Timestamp when the match was last modified */
  updatedAt: Scalars['DateTime']['output'];
  /** Current voting session of the match session or null if not started yet */
  votingSession?: Maybe<VotingSession>;
};

export enum MatchType {
  Amical = 'AMICAL',
  Championnat = 'CHAMPIONNAT',
  Tournoi = 'TOURNOI',
}

/** Current authenticated user's essential profile data */
export type Me = {
  __typename?: 'Me';
  /** Where to read this player's avatar. Null until they have uploaded one */
  avatarUrl?: Maybe<Scalars['String']['output']>;
  /** User's name displayed throughout the interface */
  displayName: Scalars['String']['output'];
  /** Primary email address of the authenticated user */
  email: Scalars['String']['output'];
  /** Unique identifier of the authenticated user */
  id: Scalars['ID']['output'];
  /** The name the squad knows this player by. Null when unset */
  nickname?: Maybe<Scalars['String']['output']>;
  /** Organization team identifier the user belongs to */
  team?: Maybe<Team>;
};

export type Mutation = {
  __typename?: 'Mutation';
  /** Closes a voting session early. Only the player who started it may do this */
  closeVotingSession: VotingSession;
  /** Attaches an uploaded object to the caller as their avatar */
  confirmAvatarUpload: Me;
  /** Attaches an uploaded object to the caller's team as its crest */
  confirmTeamCrestUpload: Team;
  /**
   * Requests permission to upload a new avatar for the caller. Accepts
   * image/jpeg, image/png and image/webp
   */
  createAvatarUploadUrl: UploadTicket;
  /** Creates a new Match with a specified name and date */
  createMatch: Match;
  /** Creates a new team with a specified name and optional sport */
  createTeam: Team;
  /**
   * Requests permission to upload a new crest for the caller's team. Only the
   * player who created the team may do this
   */
  createTeamCrestUploadUrl: UploadTicket;
  /** Registers a new user account with required credentials and profile information */
  createUser: AuthPayload;
  /** Creates a new vote session for a specified match (optionnal) */
  createVotingSession: VotingSession;
  /**
   * Permanently deletes the caller's own account.
   *
   * The person is erased - name, nickname, email address, photograph and their
   * place in the squad - and every token they hold stops working immediately.
   * The votes they cast about other players are kept and anonymised, because
   * those belong to their team-mates' history rather than to them.
   *
   * There is no user id argument: a player deletes only themselves
   */
  deleteAccount: Scalars['Boolean']['output'];
  /** Join a new team with a specified name and optional sport */
  joinTeam: Team;
  /** Refreshes the token of an existing user and returns new tokens */
  refreshToken: AuthTokens;
  /** Authenticates an existing user with credentials and returns tokens */
  signIn: AuthPayload;
  /** Creates a new vote  for a specified vote Session */
  submitVote: Vote;
  /**
   * Updates the caller's own profile. An omitted field is left untouched; an
   * empty nickname clears it and puts the player back on the display-name
   * fallback
   */
  updateProfile: Me;
};

export type MutationCloseVotingSessionArgs = {
  votingSessionId: Scalars['ID']['input'];
};

export type MutationConfirmAvatarUploadArgs = {
  key: Scalars['String']['input'];
};

export type MutationConfirmTeamCrestUploadArgs = {
  key: Scalars['String']['input'];
};

export type MutationCreateAvatarUploadUrlArgs = {
  contentType: Scalars['String']['input'];
};

export type MutationCreateMatchArgs = {
  date: Scalars['DateTime']['input'];
  name: Scalars['String']['input'];
  type: MatchType;
};

export type MutationCreateTeamArgs = {
  name: Scalars['String']['input'];
  sport?: InputMaybe<Scalars['String']['input']>;
};

export type MutationCreateTeamCrestUploadUrlArgs = {
  contentType: Scalars['String']['input'];
};

export type MutationCreateUserArgs = {
  displayName: Scalars['String']['input'];
  email: Scalars['String']['input'];
  nickname?: InputMaybe<Scalars['String']['input']>;
  password: Scalars['String']['input'];
};

export type MutationCreateVotingSessionArgs = {
  closingAt?: InputMaybe<Scalars['DateTime']['input']>;
  matchId: Scalars['ID']['input'];
};

export type MutationJoinTeamArgs = {
  code: Scalars['String']['input'];
};

export type MutationRefreshTokenArgs = {
  input: RefreshTokenInput;
};

export type MutationSignInArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type MutationSubmitVoteArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  type: VoteType;
  votedUserId: Scalars['ID']['input'];
  votingSession: Scalars['ID']['input'];
};

export type MutationUpdateProfileArgs = {
  displayName?: InputMaybe<Scalars['String']['input']>;
  nickname?: InputMaybe<Scalars['String']['input']>;
};

/**
 * One player's place in their team's standings, counted over closed voting
 * sessions only
 */
export type PlayerStanding = {
  __typename?: 'PlayerStanding';
  /** How many times the squad voted this player flop */
  flopCount: Scalars['Int']['output'];
  /** The player this row is about */
  player: User;
  /** How many times the squad voted this player top */
  topCount: Scalars['Int']['output'];
};

export type Query = {
  __typename?: 'Query';
  /** Retrieves a Match by its ID */
  getMatchById: Match;
  /** Retrieves a list of all players associated with the specified team */
  getTeamMembers: Array<User>;
  /** Validates if an email address is already registered in the system */
  isEmailTaken: Scalars['Boolean']['output'];
  /** Retrieves the current authenticated user's profile information */
  me: Me;
  /** Retrieves the team associated with the specified code */
  teamByCode: Team;
  /**
   * Standings of the caller's team, best first. Every member is listed, even
   * those nobody has voted for yet
   */
  teamRanking: Array<PlayerStanding>;
  /** Checks if the current authenticated user has already voted in the specified voting session */
  userHasVoted?: Maybe<Scalars['Boolean']['output']>;
  /** Validates if a team's code exists */
  validateTeamCode: Scalars['Boolean']['output'];
};

export type QueryGetMatchByIdArgs = {
  matchId: Scalars['ID']['input'];
};

export type QueryIsEmailTakenArgs = {
  email: Scalars['String']['input'];
};

export type QueryTeamByCodeArgs = {
  code: Scalars['String']['input'];
};

export type QueryUserHasVotedArgs = {
  playerId: Scalars['ID']['input'];
  votingSessionId: Scalars['ID']['input'];
};

export type QueryValidateTeamCodeArgs = {
  code: Scalars['String']['input'];
};

/** Input used to obtain access tokens without re-authentication */
export type RefreshTokenInput = {
  /** Token used to obtain new access tokens without re-authentication */
  refreshToken: Scalars['String']['input'];
};

export type Subscription = {
  __typename?: 'Subscription';
  /**
   * Pushes the voting session every time it changes: a ballot cast, or the
   * session closing
   */
  votingSessionUpdated: VotingSession;
};

export type SubscriptionVotingSessionUpdatedArgs = {
  votingSessionId: Scalars['ID']['input'];
};

/**
 * How many Top and Flop votes one player has collected so far in this session.
 * Public while the session is open — watching the count move is the ritual
 */
export type TallyEntry = {
  __typename?: 'TallyEntry';
  flopCount: Scalars['Int']['output'];
  player: User;
  topCount: Scalars['Int']['output'];
};

/** Team */
export type Team = {
  __typename?: 'Team';
  /** The team's code that enables users to join the team */
  code: Scalars['String']['output'];
  /** Timestamp when the team was first created */
  createdAt: Scalars['DateTime']['output'];
  /** User who created the team */
  creator: User;
  /**
   * Where to read the team's crest. Null while the team still shows a monogram
   * of its initials
   */
  crestUrl?: Maybe<Scalars['String']['output']>;
  /** Unique internal identifier for the team */
  id: Scalars['ID']['output'];
  /**
   * The team's matches, most recent first.
   *
   * Paginated because this list grows without bound in time: a club two seasons
   * in has hundreds of matches, and the history screen used to fetch every one of
   * them on each visit. `limit` and `offset` are optional so an existing caller
   * keeps working, but a client showing a list should always pass them.
   */
  matches: Array<Maybe<Match>>;
  /** Team's display name shown across the application */
  name: Scalars['String']['output'];
  /** The sport that the team specializes in */
  sport?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the team was last modified */
  updatedAt: Scalars['DateTime']['output'];
};

/** Team */
export type TeamMatchesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * Permission to upload one image straight to the bucket. The client PUTs the
 * bytes to uploadUrl, then hands key back to the matching confirm mutation —
 * which is what actually attaches the image
 */
export type UploadTicket = {
  __typename?: 'UploadTicket';
  /** The object key to send back once the upload succeeded */
  key: Scalars['String']['output'];
  /**
   * Short-lived signed URL to PUT the image bytes to. It pins the content type
   * the ticket was issued for
   */
  uploadUrl: Scalars['String']['output'];
};

/** System user account with core identity information */
export type User = {
  __typename?: 'User';
  /** Where to read this player's avatar. Null until they have uploaded one */
  avatarUrl?: Maybe<Scalars['String']['output']>;
  /** Timestamp when the user account was first created */
  createdAt: Scalars['DateTime']['output'];
  /** Timestamp when the user account was soft-deleted, if applicable */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** User's display name shown across the application */
  displayName: Scalars['String']['output'];
  /** User's verified email address for communications */
  email: Scalars['String']['output'];
  /** Reference ID linked to external systems or services */
  externalId: Scalars['ID']['output'];
  /** Unique internal identifier for the user */
  id: Scalars['ID']['output'];
  /**
   * The name the squad knows this player by. Null when unset, in which case
   * clients fall back to the first word of the display name
   */
  nickname?: Maybe<Scalars['String']['output']>;
  /** Reference to team membership for organizational structure */
  team?: Maybe<Team>;
  /** Timestamp when the user account was last modified */
  updatedAt: Scalars['DateTime']['output'];
};

/** Represents a single vote cast by a user in a voting session, indicating their top and flop choices */
export type Vote = {
  __typename?: 'Vote';
  /** Timestamp when the vote was first created */
  createdAt: Scalars['DateTime']['output'];
  /** Timestamp when the vote was soft deleted */
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Optional description or comment for the vote */
  description?: Maybe<Scalars['String']['output']>;
  /** Unique internal identifier for the vote */
  id: Scalars['ID']['output'];
  /** The type of vote (top or flop) */
  type: VoteType;
  /** Timestamp when the vote was last modified */
  updatedAt: Scalars['DateTime']['output'];
  /** The user voted */
  voted: User;
  /** The user who cast this vote */
  voter: User;
  /** The voting session this vote belongs to */
  votingSession: VotingSession;
};

export enum VoteClosureReason {
  Admin = 'ADMIN',
  Deadline = 'DEADLINE',
  Unanimous = 'UNANIMOUS',
}

export type VoteResult = {
  __typename?: 'VoteResult';
  flop: User;
  top: User;
};

export enum VoteSessionStatus {
  Completed = 'COMPLETED',
  InProgress = 'IN_PROGRESS',
  NotStarted = 'NOT_STARTED',
}

export enum VoteType {
  Flop = 'FLOP',
  Top = 'TOP',
}

export type VotingSession = {
  __typename?: 'VotingSession';
  /** Ballot progress of every player on the match roster */
  ballots: Array<BallotProgress>;
  /** When the session actually closed. Null while it is open */
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  /** Why the session closed. Null while it is open */
  closedReason?: Maybe<VoteClosureReason>;
  /** Optional date and time when the voting session will close */
  closingAt?: Maybe<Scalars['DateTime']['output']>;
  /** Timestamp when the vote session was first created */
  createdAt: Scalars['DateTime']['output'];
  /** Unique internal identifier for the voting session */
  id: Scalars['ID']['output'];
  /** The match associated with this voting session */
  match: Match;
  /** User who initiated the voting session */
  startedBy: User;
  /** Current voting status of the session */
  status: VoteSessionStatus;
  /** The live count, one entry per player who has received at least one vote */
  tally: Array<TallyEntry>;
  /** The remaining time for an open voting session in seconds */
  timeRemaining: Scalars['Int']['output'];
  /** Timestamp when the vote session was last modified */
  updatedAt: Scalars['DateTime']['output'];
  /**
   * Results of the voting session, including the top and flop users. Null until
   * the session closes
   */
  voteResult?: Maybe<VoteResult>;
  /** Every vote cast so far, with its comment */
  votes: Array<Vote>;
};

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> {
  subscribe: SubscriptionSubscribeFn<
    { [key in TKey]: TResult },
    TParent,
    TContext,
    TArgs
  >;
  resolve?: SubscriptionResolveFn<
    TResult,
    { [key in TKey]: TResult },
    TContext,
    TArgs
  >;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs,
> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = {},
  TContext = {},
  TArgs = {},
> =
  | ((
      ...args: any[]
    ) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (
  obj: T,
  context: TContext,
  info: GraphQLResolveInfo,
) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = {},
  TParent = {},
  TContext = {},
  TArgs = {},
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  AuthPayload: ResolverTypeWrapper<
    Omit<AuthPayload, 'user'> & { user: ResolversTypes['User'] }
  >;
  AuthTokens: ResolverTypeWrapper<AuthTokensEntity>;
  BallotProgress: ResolverTypeWrapper<
    Omit<BallotProgress, 'player'> & { player: ResolversTypes['User'] }
  >;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  Email: ResolverTypeWrapper<Scalars['Email']['output']>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Match: ResolverTypeWrapper<MatchEntity>;
  MatchType: MatchType;
  Me: ResolverTypeWrapper<MeEntity>;
  Mutation: ResolverTypeWrapper<{}>;
  PlayerStanding: ResolverTypeWrapper<
    Omit<PlayerStanding, 'player'> & { player: ResolversTypes['User'] }
  >;
  Query: ResolverTypeWrapper<{}>;
  RefreshTokenInput: RefreshTokenInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  TallyEntry: ResolverTypeWrapper<
    Omit<TallyEntry, 'player'> & { player: ResolversTypes['User'] }
  >;
  Team: ResolverTypeWrapper<TeamEntity>;
  UploadTicket: ResolverTypeWrapper<UploadTicketEntity>;
  User: ResolverTypeWrapper<UserEntity>;
  Vote: ResolverTypeWrapper<VoteEntity>;
  VoteClosureReason: VoteClosureReason;
  VoteResult: ResolverTypeWrapper<
    Omit<VoteResult, 'flop' | 'top'> & {
      flop: ResolversTypes['User'];
      top: ResolversTypes['User'];
    }
  >;
  VoteSessionStatus: VoteSessionStatus;
  VoteType: VoteType;
  VotingSession: ResolverTypeWrapper<VotingSessionEntity>;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  AuthPayload: Omit<AuthPayload, 'user'> & {
    user: ResolversParentTypes['User'];
  };
  AuthTokens: AuthTokensEntity;
  BallotProgress: Omit<BallotProgress, 'player'> & {
    player: ResolversParentTypes['User'];
  };
  Boolean: Scalars['Boolean']['output'];
  DateTime: Scalars['DateTime']['output'];
  Email: Scalars['Email']['output'];
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Match: MatchEntity;
  Me: MeEntity;
  Mutation: {};
  PlayerStanding: Omit<PlayerStanding, 'player'> & {
    player: ResolversParentTypes['User'];
  };
  Query: {};
  RefreshTokenInput: RefreshTokenInput;
  String: Scalars['String']['output'];
  Subscription: {};
  TallyEntry: Omit<TallyEntry, 'player'> & {
    player: ResolversParentTypes['User'];
  };
  Team: TeamEntity;
  UploadTicket: UploadTicketEntity;
  User: UserEntity;
  Vote: VoteEntity;
  VoteResult: Omit<VoteResult, 'flop' | 'top'> & {
    flop: ResolversParentTypes['User'];
    top: ResolversParentTypes['User'];
  };
  VotingSession: VotingSessionEntity;
}>;

export type AuthPayloadResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['AuthPayload'] =
    ResolversParentTypes['AuthPayload'],
> = ResolversObject<{
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type AuthTokensResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['AuthTokens'] =
    ResolversParentTypes['AuthTokens'],
> = ResolversObject<{
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expiredAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type BallotProgressResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['BallotProgress'] =
    ResolversParentTypes['BallotProgress'],
> = ResolversObject<{
  hasFlop?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasTop?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  player?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<
  ResolversTypes['DateTime'],
  any
> {
  name: 'DateTime';
}

export interface EmailScalarConfig extends GraphQLScalarTypeConfig<
  ResolversTypes['Email'],
  any
> {
  name: 'Email';
}

export type MatchResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['Match'] =
    ResolversParentTypes['Match'],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deletedAt?: Resolver<
    Maybe<ResolversTypes['DateTime']>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  players?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  team?: Resolver<ResolversTypes['Team'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['MatchType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  votingSession?: Resolver<
    Maybe<ResolversTypes['VotingSession']>,
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MeResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['Me'] = ResolversParentTypes['Me'],
> = ResolversObject<{
  avatarUrl?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nickname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type MutationResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['Mutation'] =
    ResolversParentTypes['Mutation'],
> = ResolversObject<{
  closeVotingSession?: Resolver<
    ResolversTypes['VotingSession'],
    ParentType,
    ContextType,
    RequireFields<MutationCloseVotingSessionArgs, 'votingSessionId'>
  >;
  confirmAvatarUpload?: Resolver<
    ResolversTypes['Me'],
    ParentType,
    ContextType,
    RequireFields<MutationConfirmAvatarUploadArgs, 'key'>
  >;
  confirmTeamCrestUpload?: Resolver<
    ResolversTypes['Team'],
    ParentType,
    ContextType,
    RequireFields<MutationConfirmTeamCrestUploadArgs, 'key'>
  >;
  createAvatarUploadUrl?: Resolver<
    ResolversTypes['UploadTicket'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateAvatarUploadUrlArgs, 'contentType'>
  >;
  createMatch?: Resolver<
    ResolversTypes['Match'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateMatchArgs, 'date' | 'name' | 'type'>
  >;
  createTeam?: Resolver<
    ResolversTypes['Team'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateTeamArgs, 'name'>
  >;
  createTeamCrestUploadUrl?: Resolver<
    ResolversTypes['UploadTicket'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateTeamCrestUploadUrlArgs, 'contentType'>
  >;
  createUser?: Resolver<
    ResolversTypes['AuthPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateUserArgs, 'displayName' | 'email' | 'password'>
  >;
  createVotingSession?: Resolver<
    ResolversTypes['VotingSession'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateVotingSessionArgs, 'matchId'>
  >;
  deleteAccount?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  joinTeam?: Resolver<
    ResolversTypes['Team'],
    ParentType,
    ContextType,
    RequireFields<MutationJoinTeamArgs, 'code'>
  >;
  refreshToken?: Resolver<
    ResolversTypes['AuthTokens'],
    ParentType,
    ContextType,
    RequireFields<MutationRefreshTokenArgs, 'input'>
  >;
  signIn?: Resolver<
    ResolversTypes['AuthPayload'],
    ParentType,
    ContextType,
    RequireFields<MutationSignInArgs, 'email' | 'password'>
  >;
  submitVote?: Resolver<
    ResolversTypes['Vote'],
    ParentType,
    ContextType,
    RequireFields<
      MutationSubmitVoteArgs,
      'type' | 'votedUserId' | 'votingSession'
    >
  >;
  updateProfile?: Resolver<
    ResolversTypes['Me'],
    ParentType,
    ContextType,
    Partial<MutationUpdateProfileArgs>
  >;
}>;

export type PlayerStandingResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['PlayerStanding'] =
    ResolversParentTypes['PlayerStanding'],
> = ResolversObject<{
  flopCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  player?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  topCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type QueryResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['Query'] =
    ResolversParentTypes['Query'],
> = ResolversObject<{
  getMatchById?: Resolver<
    ResolversTypes['Match'],
    ParentType,
    ContextType,
    RequireFields<QueryGetMatchByIdArgs, 'matchId'>
  >;
  getTeamMembers?: Resolver<
    Array<ResolversTypes['User']>,
    ParentType,
    ContextType
  >;
  isEmailTaken?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType,
    RequireFields<QueryIsEmailTakenArgs, 'email'>
  >;
  me?: Resolver<ResolversTypes['Me'], ParentType, ContextType>;
  teamByCode?: Resolver<
    ResolversTypes['Team'],
    ParentType,
    ContextType,
    RequireFields<QueryTeamByCodeArgs, 'code'>
  >;
  teamRanking?: Resolver<
    Array<ResolversTypes['PlayerStanding']>,
    ParentType,
    ContextType
  >;
  userHasVoted?: Resolver<
    Maybe<ResolversTypes['Boolean']>,
    ParentType,
    ContextType,
    RequireFields<QueryUserHasVotedArgs, 'playerId' | 'votingSessionId'>
  >;
  validateTeamCode?: Resolver<
    ResolversTypes['Boolean'],
    ParentType,
    ContextType,
    RequireFields<QueryValidateTeamCodeArgs, 'code'>
  >;
}>;

export type SubscriptionResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['Subscription'] =
    ResolversParentTypes['Subscription'],
> = ResolversObject<{
  votingSessionUpdated?: SubscriptionResolver<
    ResolversTypes['VotingSession'],
    'votingSessionUpdated',
    ParentType,
    ContextType,
    RequireFields<SubscriptionVotingSessionUpdatedArgs, 'votingSessionId'>
  >;
}>;

export type TallyEntryResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['TallyEntry'] =
    ResolversParentTypes['TallyEntry'],
> = ResolversObject<{
  flopCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  player?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  topCount?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type TeamResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['Team'] =
    ResolversParentTypes['Team'],
> = ResolversObject<{
  code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  crestUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  matches?: Resolver<
    Array<Maybe<ResolversTypes['Match']>>,
    ParentType,
    ContextType,
    Partial<TeamMatchesArgs>
  >;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sport?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UploadTicketResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['UploadTicket'] =
    ResolversParentTypes['UploadTicket'],
> = ResolversObject<{
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uploadUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type UserResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['User'] =
    ResolversParentTypes['User'],
> = ResolversObject<{
  avatarUrl?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deletedAt?: Resolver<
    Maybe<ResolversTypes['DateTime']>,
    ParentType,
    ContextType
  >;
  displayName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  externalId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nickname?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  team?: Resolver<Maybe<ResolversTypes['Team']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VoteResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['Vote'] =
    ResolversParentTypes['Vote'],
> = ResolversObject<{
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  deletedAt?: Resolver<
    Maybe<ResolversTypes['DateTime']>,
    ParentType,
    ContextType
  >;
  description?: Resolver<
    Maybe<ResolversTypes['String']>,
    ParentType,
    ContextType
  >;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['VoteType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  voted?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  voter?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  votingSession?: Resolver<
    ResolversTypes['VotingSession'],
    ParentType,
    ContextType
  >;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VoteResultResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['VoteResult'] =
    ResolversParentTypes['VoteResult'],
> = ResolversObject<{
  flop?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  top?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type VotingSessionResolvers<
  ContextType = AppContext,
  ParentType extends ResolversParentTypes['VotingSession'] =
    ResolversParentTypes['VotingSession'],
> = ResolversObject<{
  ballots?: Resolver<
    Array<ResolversTypes['BallotProgress']>,
    ParentType,
    ContextType
  >;
  closedAt?: Resolver<
    Maybe<ResolversTypes['DateTime']>,
    ParentType,
    ContextType
  >;
  closedReason?: Resolver<
    Maybe<ResolversTypes['VoteClosureReason']>,
    ParentType,
    ContextType
  >;
  closingAt?: Resolver<
    Maybe<ResolversTypes['DateTime']>,
    ParentType,
    ContextType
  >;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  match?: Resolver<ResolversTypes['Match'], ParentType, ContextType>;
  startedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  status?: Resolver<
    ResolversTypes['VoteSessionStatus'],
    ParentType,
    ContextType
  >;
  tally?: Resolver<
    Array<ResolversTypes['TallyEntry']>,
    ParentType,
    ContextType
  >;
  timeRemaining?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  voteResult?: Resolver<
    Maybe<ResolversTypes['VoteResult']>,
    ParentType,
    ContextType
  >;
  votes?: Resolver<Array<ResolversTypes['Vote']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = AppContext> = ResolversObject<{
  AuthPayload?: AuthPayloadResolvers<ContextType>;
  AuthTokens?: AuthTokensResolvers<ContextType>;
  BallotProgress?: BallotProgressResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  Email?: GraphQLScalarType;
  Match?: MatchResolvers<ContextType>;
  Me?: MeResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PlayerStanding?: PlayerStandingResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  TallyEntry?: TallyEntryResolvers<ContextType>;
  Team?: TeamResolvers<ContextType>;
  UploadTicket?: UploadTicketResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Vote?: VoteResolvers<ContextType>;
  VoteResult?: VoteResultResolvers<ContextType>;
  VotingSession?: VotingSessionResolvers<ContextType>;
}>;
