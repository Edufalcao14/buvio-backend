import { VotingSessionEntity } from './votingSession';

export enum VotingSessionStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

type ClosureShape = Pick<VotingSessionEntity, 'closedAt' | 'closingAt'>;

/**
 * A session is closed once it has been closed, or once its deadline has
 * passed.
 *
 * The deadline case matters between sweeps: the sweeper closes overdue
 * sessions within seconds, and until it does, every read still has to report
 * the session as closed rather than accept votes for it.
 */
export const isVotingSessionClosed = (
  session: ClosureShape,
  now: Date = new Date(),
): boolean =>
  session.closedAt !== null ||
  (session.closingAt !== null && now >= session.closingAt);

export const votingSessionStatusOf = (
  session: ClosureShape,
  now: Date = new Date(),
): VotingSessionStatus =>
  isVotingSessionClosed(session, now)
    ? VotingSessionStatus.COMPLETED
    : VotingSessionStatus.IN_PROGRESS;

export const isVotingSessionOpen = (
  session: ClosureShape,
  now: Date = new Date(),
): boolean => !isVotingSessionClosed(session, now);

/**
 * Seconds left before the session closes: -1 when it never closes on its own,
 * 0 once it has closed.
 */
export const votingSessionTimeRemaining = (
  session: ClosureShape,
  now: Date = new Date(),
): number => {
  if (session.closedAt !== null) {
    return 0;
  }

  if (!session.closingAt) {
    return -1;
  }

  const remainingMs = session.closingAt.getTime() - now.getTime();

  return remainingMs <= 0 ? 0 : Math.floor(remainingMs / 1000);
};
