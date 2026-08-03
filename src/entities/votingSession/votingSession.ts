import { ClosureReason } from './closure-reason';

export type VotingSessionEntity = {
  id: string;
  /** When the session is *scheduled* to close. */
  closingAt: Date | null;
  /** When it actually closed. Null while open. */
  closedAt: Date | null;
  closedReason: ClosureReason | null;
  startedBy: string;
  matchId: string;
  createdAt: Date;
  updatedAt: Date;
};
