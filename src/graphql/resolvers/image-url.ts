import { AppContext } from '../../libs/context';

/**
 * Turns a stored object key into the URL a client reads the image from.
 *
 * Rows hold the key, never the URL: the bucket's public host is configuration,
 * and baking it into every row would make moving buckets a data migration. The
 * translation therefore happens here, on every read.
 *
 * A missing key is a player without an avatar or a team still showing its
 * monogram, which is a normal state and not an error — hence null rather than
 * a placeholder URL, so the client picks the fallback it wants to draw.
 */
export const imageUrlOrNull = (
  context: AppContext,
  key: string | null,
): string | null => {
  if (!key) {
    return null;
  }

  return context.gateways.storage.publicUrlFor(key);
};
