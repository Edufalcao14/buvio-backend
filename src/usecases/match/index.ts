import { createMatch } from './create-match';
import { getMatchById } from './get-match-by-id';
import { getMatchesByTeamId } from './get-matches-by-team-id';
import { getMatchesByUserTeamId } from './get-matches-by-user-team-id';
import { getPlayersByMatchId } from './get-players-by-match-id';

export const initMatchUsecases = () => {
  return {
    getById: getMatchById,
    getMatchesByUserTeamId: getMatchesByUserTeamId,
    getMatchesByTeamId: getMatchesByTeamId,
    getPlayersByMatchId: getPlayersByMatchId,
    create: createMatch,
  };
};

export type MatchUsecases = ReturnType<typeof initMatchUsecases>;
