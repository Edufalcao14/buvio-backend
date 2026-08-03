import { Selectable } from 'kysely';
import { VotingSessions } from '../../models';
import { VotingSessionEntity } from '../../../../entities/votingSession/votingSession';
import { ClosureReason } from '../../../../entities/votingSession/closure-reason';

export const toVotingSessionEntity = (
  model: Selectable<VotingSessions>,
): VotingSessionEntity => {
  return {
    id: model.id,
    closingAt: model.closing_at,
    closedAt: model.closed_at,
    closedReason: model.closed_reason as ClosureReason | null,
    startedBy: model.started_by,
    matchId: model.match_id,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
};
