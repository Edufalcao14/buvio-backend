import { dbUserFixtures } from './user';
import { dbTeamFixtures } from './team';
import { dbMatchFixtures } from './match';
import { dbVotingSessionFixtures } from './votingSession';
import { dbVoteFixtures } from './vote';

export const dbFixtures = {
  user: dbUserFixtures,
  team: dbTeamFixtures,
  match: dbMatchFixtures,
  votingSession: dbVotingSessionFixtures,
  vote: dbVoteFixtures,
};
