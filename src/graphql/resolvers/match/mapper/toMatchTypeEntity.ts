import { MatchType as GraphQLMatchType } from '../../../__generated__/resolvers-types';
import { MatchType as EntityMatchType } from '../../../../entities/match/match-type';

export const toEntityMatchType = (type: GraphQLMatchType): EntityMatchType => {
  switch (type) {
    case GraphQLMatchType.Amical:
      return EntityMatchType.AMICAL;
    case GraphQLMatchType.Championnat:
      return EntityMatchType.CHAMPIONNAT;
    case GraphQLMatchType.Tournoi:
      return EntityMatchType.TOURNOI;
  }
};
