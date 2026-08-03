import { AppContext } from '../../libs/context';
import { VotingSessionEntity } from '../../entities/votingSession/votingSession';
import { VoteType } from '../../entities/vote/vote-type';
import {
  requireTeamMember,
  requireVotingSessionInTeam,
} from '../shared/authorization';

export type TallyEntry = {
  userId: string;
  topCount: number;
  flopCount: number;
};

/**
 * The live count of an ongoing session.
 *
 * Unlike the Verdict, this is public while the session is open: watching the
 * count move is the point of the ritual (see CONTEXT.md — "Tally").
 */
export const getTally = async (
  ctx: AppContext,
  votingSession: VotingSessionEntity,
): Promise<TallyEntry[]> => {
  const { teamId } = await requireTeamMember(ctx);
  await requireVotingSessionInTeam(ctx, votingSession.id, teamId);

  const tallies = await ctx.repositories.vote.tallyByVotingSessionId(
    votingSession.id,
  );

  const byUser = new Map<string, TallyEntry>();

  for (const tally of tallies) {
    const entry = byUser.get(tally.votedForUserId) ?? {
      userId: tally.votedForUserId,
      topCount: 0,
      flopCount: 0,
    };

    if (tally.type === VoteType.TOP) {
      entry.topCount += tally.count;
    } else {
      entry.flopCount += tally.count;
    }

    byUser.set(tally.votedForUserId, entry);
  }

  return [...byUser.values()].sort(
    (a, b) => b.topCount - a.topCount || b.flopCount - a.flopCount,
  );
};
