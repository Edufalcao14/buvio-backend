import { Usecases } from '../../../usecases';
import {
  VoteClosureReason,
  VotingSessionResolvers,
} from '../../__generated__/resolvers-types';
import {
  votingSessionStatusOf,
  votingSessionTimeRemaining,
} from '../../../entities/votingSession/voting-session-status';
import { toGraphQLVotingSessionStatus } from './mapper/voting-session-status';
import { ballotProgress } from '../../../entities/vote/ballot';

export const initVotingSessionResolvers = (
  usecases: Usecases,
): VotingSessionResolvers => ({
  id: (parent) => {
    return parent.id;
  },
  match: async (parent, _, context) => {
    return await usecases.match.getById(context, parent.matchId);
  },
  startedBy: async (parent, _, context) => {
    return await usecases.user.getById(context, parent.startedBy);
  },
  updatedAt: (parent) => {
    return parent.updatedAt;
  },
  createdAt: (parent) => {
    return parent.createdAt;
  },
  // Both derive from the session already in hand. Re-fetching it (and the match,
  // and the caller) per field cost about five queries per session for data the
  // parent object carries.
  status: (parent) => {
    return toGraphQLVotingSessionStatus(votingSessionStatusOf(parent));
  },
  timeRemaining: (parent) => {
    return votingSessionTimeRemaining(parent);
  },
  closingAt: (parent) => {
    return parent.closingAt;
  },
  closedAt: (parent) => {
    return parent.closedAt;
  },
  closedReason: (parent) => {
    // The domain enum and the schema enum carry the same members by design.
    return parent.closedReason
      ? (parent.closedReason as unknown as VoteClosureReason)
      : null;
  },
  ballots: async (parent, _, context) => {
    const [roster, votes] = await Promise.all([
      usecases.match.getPlayersByMatchId(context, parent.matchId),
      usecases.vote.listBySession(context, parent),
    ]);

    const progress = ballotProgress(
      roster.map((player) => player.id),
      votes,
    );

    // The roster is already loaded, so pairing by id costs nothing extra.
    return progress.map((entry) => ({
      player: roster.find((player) => player.id === entry.voterId)!,
      hasTop: entry.hasTop,
      hasFlop: entry.hasFlop,
      isComplete: entry.isComplete,
    }));
  },
  tally: async (parent, _, context) => {
    const entries = await usecases.vote.getTally(context, parent);

    return Promise.all(
      entries.map(async (entry) => ({
        player: await usecases.user.getById(context, entry.userId),
        topCount: entry.topCount,
        flopCount: entry.flopCount,
      })),
    );
  },
  votes: async (parent, _, context) => {
    return usecases.vote.listBySession(context, parent);
  },
  voteResult: async (parent, _, context) => {
    const result = await usecases.vote.getResult(context, parent);

    if (!result) {
      return null;
    }

    const [top, flop] = await Promise.all([
      usecases.user.getById(context, result.topUserId),
      usecases.user.getById(context, result.flopUserId),
    ]);

    return { top, flop };
  },
});
