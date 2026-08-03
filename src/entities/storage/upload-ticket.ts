/**
 * What the client needs to put an image in the bucket itself: where to PUT the
 * bytes, and the key it must hand back to the confirming mutation.
 *
 * The key travels back to us rather than being remembered server-side because
 * nothing is reserved when a ticket is issued — an upload the client abandons
 * leaves no row to clean up, only an unreferenced object.
 */
export type UploadTicketEntity = {
  uploadUrl: string;
  key: string;
};
