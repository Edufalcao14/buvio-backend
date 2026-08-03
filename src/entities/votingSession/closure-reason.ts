/** Why a voting session closed. See CONTEXT.md — "Closure Reason". */
export enum ClosureReason {
  /** The player who started the session ended it deliberately. */
  ADMIN = 'ADMIN',
  /** The session reached the moment it was scheduled to close. */
  DEADLINE = 'DEADLINE',
  /** Every player on the roster completed their ballot. */
  UNANIMOUS = 'UNANIMOUS',
}
