import { MatchType } from './match-type';

export type CreateMatchInput = {
  name: string;
  date: Date;
  type: MatchType;
};
