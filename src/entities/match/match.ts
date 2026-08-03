import { MatchType } from './match-type';

export type MatchEntity = {
  id: string;
  name: string;
  date: Date;
  type: MatchType;
  creatorId: string;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
