import { createVotingSession } from './create-session-vote';
import { getVotingSessionById } from './get-by-id';
import { getVotingSessionByMatchId } from './get-session-by-match-id';
import { getVotingSessionStatusByMatchId } from './get-session-vote-status-by-match-id';
import { getVotingTimeRemaining } from './get-voting-time-remaining';
import { closeVotingSession } from './close-voting-session';
import { closeOverdueVotingSessions } from './close-overdue-sessions';

export const initSessionVoteUsecases = () => {
  return {
    getByMatchId: getVotingSessionByMatchId,
    getStatusByMatchId: getVotingSessionStatusByMatchId,
    create: createVotingSession,
    getVotingTimeRemaining: getVotingTimeRemaining,
    getById: getVotingSessionById,
    close: closeVotingSession,
    closeOverdue: closeOverdueVotingSessions,
  };
};

export type SessionVoteUsecases = ReturnType<typeof initSessionVoteUsecases>;
