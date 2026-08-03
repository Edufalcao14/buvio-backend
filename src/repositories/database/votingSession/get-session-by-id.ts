import { Kysely } from 'kysely';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { NotFoundError } from '../../../entities/errors/not-found-error';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';

export function initGetVotingSessionByIdRepository(
  db: Kysely<DB>,
  dataloaderByIds: DataLoader<string, VotingSessionEntity | NotFoundError>,
) {
  return async (id: string): Promise<VotingSessionEntity> => {
    const votingSession = await dataloaderByIds.load(id);

    if (votingSession instanceof NotFoundError) {
      throw votingSession;
    }

    return votingSession;
  };
}
