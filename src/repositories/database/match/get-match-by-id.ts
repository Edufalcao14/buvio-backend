import { Kysely } from 'kysely';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { MatchEntity } from '../../../entities/match/match';
import { NotFoundError } from '../../../entities/errors/not-found-error';

export function initGetMatchByIdRepository(
  db: Kysely<DB>,
  dataloaderByMatchIds: DataLoader<string, MatchEntity | NotFoundError>,
) {
  return async (matchId: string): Promise<MatchEntity> => {
    const match = await dataloaderByMatchIds.load(matchId);
    if (match instanceof NotFoundError) {
      throw match;
    }
    return match;
  };
}
