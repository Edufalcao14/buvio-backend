import { AppContext } from '../context';
import { closeOverdueVotingSessions } from '../../usecases/sessionVote/close-overdue-sessions';

export const SWEEP_INTERVAL_MS = 10_000;

/**
 * Closes sessions whose deadline has passed, forever.
 *
 * A deadline is the one closure nobody triggers by acting, so something has to
 * notice it. The sweep is idempotent, which is what lets it run on a timer
 * without coordinating with the admin's mutation or the last ballot: whoever
 * gets there first closes the session, the others get null and stay quiet.
 *
 * A failed sweep is logged and forgotten — the next one picks up the same rows.
 */
export const startVotingSessionSweeper = (
  buildContext: () => AppContext,
  intervalMs: number = SWEEP_INTERVAL_MS,
): (() => void) => {
  let running = false;

  const sweep = async (): Promise<void> => {
    // Skip rather than queue: a sweep that outlives its interval means the
    // database is slow, and piling more of them on will not help.
    if (running) {
      return;
    }

    running = true;
    const ctx = buildContext();

    try {
      const closed = await closeOverdueVotingSessions(ctx);

      if (closed > 0) {
        ctx.logger.info(
          { closed },
          'Closed voting sessions past their deadline',
        );
      }
    } catch (error) {
      ctx.logger.error({ error }, 'Voting session sweep failed');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(sweep, intervalMs);
  // Never hold the process open just to sweep.
  timer.unref?.();

  void sweep();

  return () => clearInterval(timer);
};
