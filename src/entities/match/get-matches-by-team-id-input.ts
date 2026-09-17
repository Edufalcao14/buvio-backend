/**
 * Optional on both sides: an omitted `limit` and `offset` mean "all of them",
 * which is the batched, dataloader-backed path. A caller rendering a list is
 * expected to pass them.
 */
export type GetMatchesByTeamIdInputEntity = {
  limit?: number;
  offset?: number;
};
