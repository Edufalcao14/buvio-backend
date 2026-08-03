import { Selectable } from 'kysely';
import { Matches } from '../../models';
import { MatchEntity } from '../../../../entities/match/match';
import { toMatchTypeEntity } from './match-type';

export const toMatchEntity = (model: Selectable<Matches>): MatchEntity => {
  return {
    id: model.id,
    name: model.name,
    date: model.date,
    creatorId: model.created_by,
    type: toMatchTypeEntity(model.type),
    teamId: model.team_id,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
    deletedAt: model.deleted_at,
  };
};
