import { Kysely } from 'kysely';
import { DB } from '../models';
import DataLoader from 'dataloader';
import { VotingSessionEntity } from '../../../entities/votingSession/votingSession';

export function initGetVotingSessionByMatchIdRepository(
  db: Kysely<DB>,
  dataloaderByMatchIds: DataLoader<string, VotingSessionEntity | null>,
) {
  return async (matchId: string): Promise<VotingSessionEntity | null> => {
    return dataloaderByMatchIds.load(matchId);
  };
}
