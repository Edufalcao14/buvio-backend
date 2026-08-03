import { VoteType as GraphQLVoteType } from '../../../__generated__/resolvers-types';
import { VoteType as EntityVoteType } from '../../../../entities/vote/vote-type';

export const toEntityVoteType = (type: GraphQLVoteType): EntityVoteType => {
  switch (type) {
    case GraphQLVoteType.Top:
      return EntityVoteType.TOP;
    case GraphQLVoteType.Flop:
      return EntityVoteType.FLOP;
  }
};

export const toGraphQLVoteType = (type: EntityVoteType): GraphQLVoteType => {
  switch (type) {
    case EntityVoteType.TOP:
      return GraphQLVoteType.Top;
    case EntityVoteType.FLOP:
      return GraphQLVoteType.Flop;
  }
};
