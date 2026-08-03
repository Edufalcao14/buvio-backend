import { MatchType as DatabaseMatchType } from '../../models';
import { MatchType as MatchTypeEntity } from '../../../../entities/match/match-type';

export const toMatchTypeEntity = (type: DatabaseMatchType): MatchTypeEntity => {
  switch (type) {
    case 'AMICAL':
      return MatchTypeEntity.AMICAL;
    case 'CHAMPIONNAT':
      return MatchTypeEntity.CHAMPIONNAT;
    case 'TOURNOI':
      return MatchTypeEntity.TOURNOI;
    default:
      throw new Error(`Invalid match type: ${type}`);
  }
};
