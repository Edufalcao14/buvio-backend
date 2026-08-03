import { v4 as uuidv4 } from 'uuid';

/**
 * The ceiling the signature records for an image upload.
 *
 * The client resizes before uploading, so an avatar is a few tens of kilobytes;
 * a megabyte is generous for a resized picture and still small enough that an
 * object far above it is obviously not one of ours.
 */
export const MAX_IMAGE_UPLOAD_BYTES = 1024 * 1024;

/**
 * The image formats an avatar or a crest may be uploaded in, mapped to the
 * extension their object key gets.
 *
 * The signature pins one of these content types, so this list is also the list
 * of things a signed URL can ever be used to store: anything outside it (an
 * SVG with a script in it, an HTML page served from our own bucket) is refused
 * before a URL exists.
 */
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const extensionForImageContentType = (
  contentType: string,
): string | null =>
  EXTENSION_BY_CONTENT_TYPE[contentType.toLowerCase()] ?? null;

/**
 * Where one player's avatars live. The player id is in the path so a confirm
 * can prove ownership from the key alone, without a lookup.
 */
export const avatarKeyPrefix = (userId: string): string => `avatars/${userId}/`;

/** Same idea for a team's crests. */
export const crestKeyPrefix = (teamId: string): string => `crests/${teamId}/`;

/**
 * A fresh key under `prefix`.
 *
 * The uuid filename is what makes the object unguessable: the bucket is public,
 * so a predictable key (the player id alone, say) would let anyone read a
 * picture by constructing its URL. It also means a new upload never overwrites
 * the object a client may still be showing from cache.
 */
export const buildImageKey = (prefix: string, extension: string): string =>
  `${prefix}${uuidv4()}.${extension}`;

/**
 * Whether a key the client sends back at confirm time is one we would have
 * signed for that owner.
 *
 * Confirm is the step that attaches an image, so without this check a caller
 * could confirm a teammate's key and wear their face.
 */
export const isImageKeyUnder = (prefix: string, key: string): boolean => {
  if (!key.startsWith(prefix)) {
    return false;
  }

  const filename = key.slice(prefix.length);

  // No traversal and no nesting: the only thing we ever sign under a prefix is
  // a single `<uuid>.<ext>` file.
  return /^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(filename);
};
