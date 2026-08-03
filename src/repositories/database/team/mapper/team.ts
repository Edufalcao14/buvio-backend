import { Selectable } from 'kysely';
import { Teams } from '../../models';
import { TeamEntity } from '../../../../entities/team/team';

export const toTeamEntity = (model: Selectable<Teams>): TeamEntity => {
  return {
    id: model.id,
    name: model.name,
    code: model.code,
    sport: model.sport,
    crestKey: model.crest_key,
    creatorId: model.created_by,
    createdAt: model.created_at,
    updatedAt: model.updated_at,
  };
};
