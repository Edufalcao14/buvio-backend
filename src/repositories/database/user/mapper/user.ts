import { Selectable } from 'kysely';
import { Users } from '../../models';
import { UserEntity } from '../../../../entities/user/user';
import { TeamEntity } from '../../../../entities/team/team';

export const toUserEntity = (model: Selectable<Users>): UserEntity => {
  return {
    id: model.id,
    displayName: model.display_name,
    nickname: model.nickname,
    email: model.email,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
    deletedAt: model.deleted_at,
    externalId: model.external_id,
    teamId: model.team_id,
    avatarKey: model.avatar_key,
  };
};
