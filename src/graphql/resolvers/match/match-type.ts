import { MatchType as GraphQLMatchType } from '../../__generated__/resolvers-types';
import { MatchType as TypeScriptMatchType } from '../../../entities/match/match-type';

export const mapMatchType = (type: string): GraphQLMatchType => {
  switch (type) {
    case TypeScriptMatchType.AMICAL:
      return GraphQLMatchType.Amical;
    case TypeScriptMatchType.TOURNOI:
      return GraphQLMatchType.Tournoi;
    case TypeScriptMatchType.CHAMPIONNAT:
      return GraphQLMatchType.Championnat;
    default:
      throw new Error(`Unknown match type: ${type}`);
  }
};
