import { Selectable } from 'kysely';
import { Votes } from '../../models';
import { VoteEntity } from '../../../../entities/vote/vote';
import { VoteType } from '../../../../entities/vote/vote-type';

export const toVoteEntity = (model: Selectable<Votes>): VoteEntity => {
  return {
    id: model.id,
    votingSessionId: model.voting_session_id,
    createdBy: model.created_by,
    votedForUserId: model.voted_for_user_id,
    type: model.type as VoteType,
    description: model.description,
    updatedAt: model.updated_at,
    createdAt: model.created_at,
    deletedAt: model.deleted_at,
  };
};
