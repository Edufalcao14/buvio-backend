import { AppContext } from '../../libs/context';
import { ClosureReason } from '../../entities/votingSession/closure-reason';

/**
 * Closes every session whose deadline has passed and publishes each closure.
 *
 * Idempotent by construction: the repository only closes rows still open, so
 * two sweeps — or two server instances — cannot announce the same verdict
 * twice.
 */
export const closeOverdueVotingSessions = async (
  ctx: AppContext,
  now: Date = new Date(),
): Promise<number> => {
  const overdue = await ctx.repositories.votingSession.listOverdueOpen(now);
  let closedCount = 0;

  for (const session of overdue) {
    const closed = await ctx.repositories.votingSession.close(
      session.id,
      ClosureReason.DEADLINE,
      session.closingAt ?? now,
    );

    if (closed) {
      closedCount += 1;
      await ctx.events.publishVotingSession(closed);
    }
  }

  return closedCount;
};
