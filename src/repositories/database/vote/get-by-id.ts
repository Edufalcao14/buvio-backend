import { Kysely } from 'kysely';
import { UserEntity } from '../../../entities/user';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { VoteEntity } from '../../../entities/vote/vote';

export function initGetVoteByIdRepository(
  db: Kysely<DB>,
  dataloaderByIds: DataLoader<string, VoteEntity | NotFoundError>,
) {
  return async (id: string): Promise<VoteEntity> => {
    const vote = await dataloaderByIds.load(id);
    if (vote instanceof NotFoundError) {
      throw vote;
    }
    return vote;
  };
}
