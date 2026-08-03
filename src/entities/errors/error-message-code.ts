/**
 * Stable, language-neutral identifiers for every business failure the API can
 * report. Clients key their own localized copy off these; the backend never
 * ships user-facing prose.
 *
 * Rules for changing this list:
 *  - never reuse or repurpose an existing code, add a new one;
 *  - never encode data in the code itself, use the error's `details` for that;
 *  - keep codes coarse enough that two of them are never distinguishable only
 *    by whether a record exists (that is how enumeration oracles appear).
 */
export enum ErrorMessageCode {
  // Authentication and session
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_ACCOUNT_DISABLED = 'AUTH_ACCOUNT_DISABLED',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_REVOKED = 'AUTH_TOKEN_REVOKED',
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_MISSING = 'AUTH_REFRESH_TOKEN_MISSING',
  AUTH_ADMIN_REQUIRED = 'AUTH_ADMIN_REQUIRED',
  AUTH_ALREADY_IMPERSONATING = 'AUTH_ALREADY_IMPERSONATING',
  AUTH_NOT_IMPERSONATING = 'AUTH_NOT_IMPERSONATING',
  AUTH_RATE_LIMITED = 'AUTH_RATE_LIMITED',

  // Users
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_EMAIL_ALREADY_EXISTS = 'USER_EMAIL_ALREADY_EXISTS',
  USER_ALREADY_IN_TEAM = 'USER_ALREADY_IN_TEAM',
  USER_NOT_IN_TEAM = 'USER_NOT_IN_TEAM',

  // Teams
  TEAM_NOT_FOUND = 'TEAM_NOT_FOUND',
  TEAM_ACCESS_DENIED = 'TEAM_ACCESS_DENIED',
  TEAM_CODE_NOT_FOUND = 'TEAM_CODE_NOT_FOUND',
  TEAM_CODE_TAKEN = 'TEAM_CODE_TAKEN',
  TEAM_CODE_GENERATION_FAILED = 'TEAM_CODE_GENERATION_FAILED',

  // Matches
  MATCH_NOT_FOUND = 'MATCH_NOT_FOUND',

  // Voting sessions
  VOTING_SESSION_NOT_FOUND = 'VOTING_SESSION_NOT_FOUND',
  VOTING_SESSION_NOT_ADMIN = 'VOTING_SESSION_NOT_ADMIN',
  VOTING_SESSION_ALREADY_EXISTS = 'VOTING_SESSION_ALREADY_EXISTS',
  VOTING_SESSION_CLOSED = 'VOTING_SESSION_CLOSED',

  // Votes
  VOTE_NOT_FOUND = 'VOTE_NOT_FOUND',
  VOTE_ALREADY_CAST_FOR_TYPE = 'VOTE_ALREADY_CAST_FOR_TYPE',
  VOTE_SAME_PLAYER_TOP_AND_FLOP = 'VOTE_SAME_PLAYER_TOP_AND_FLOP',
  VOTE_SELF_NOT_ALLOWED = 'VOTE_SELF_NOT_ALLOWED',
  VOTE_PLAYER_NOT_IN_MATCH = 'VOTE_PLAYER_NOT_IN_MATCH',

  // Avatars and crests
  IMAGE_CONTENT_TYPE_UNSUPPORTED = 'IMAGE_CONTENT_TYPE_UNSUPPORTED',
  IMAGE_KEY_INVALID = 'IMAGE_KEY_INVALID',

  // Input validation. `details.field` names the offending field and
  // `details.rule` the constraint it broke, so clients can render per-field
  // copy without the backend inventing a code per field.
  VALIDATION_FAILED = 'VALIDATION_FAILED',

  // The document itself was refused before any resolver ran: it does not parse,
  // does not match the schema, or asks for more than the cost ceilings allow.
  REQUEST_INVALID = 'REQUEST_INVALID',
  QUERY_TOO_COMPLEX = 'QUERY_TOO_COMPLEX',

  // Anything unexpected. Never carries internal text.
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}
