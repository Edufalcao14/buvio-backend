export type TeamEntity = {
  id: string;
  name: string;
  code: string;
  creatorId: string;
  sport?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** R2 object key of the team's crest, null while it still shows a monogram. */
  crestKey: string | null;
};
