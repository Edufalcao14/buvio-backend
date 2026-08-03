import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Config } from '../../libs/config';
import { UnknownError } from '../../entities/errors/unknown-error';
import { MAX_IMAGE_UPLOAD_BYTES } from '../../entities/storage/image-upload';

/**
 * Short on purpose: the client asks for a URL and uploads immediately after, so
 * a long-lived signature is only a longer window for a leaked URL to be used.
 */
const UPLOAD_URL_TTL_SECONDS = 5 * 60;

export type PresignedUploadInput = {
  key: string;
  contentType: string;
  /**
   * Optional: callers ask for a URL for a key and a type, and the domain's
   * ceiling applies unless one of them has a reason to say otherwise.
   */
  maxBytes?: number;
};

/**
 * Cloudflare R2, driven through the S3 client: R2 speaks the S3 API, and the
 * SDK is what knows how to sign a request.
 *
 * The client is built on first use rather than at boot so the server still
 * starts with no R2 configuration — identity pictures are optional, and a
 * deployment without a bucket should lose avatars, not the whole API.
 */
export const initStorageGateway = (config: Config) => {
  let client: S3Client | undefined;

  const requireBucket = (): string => {
    if (!config.r2.bucket) {
      throw new UnknownError('storage.missingConfiguration');
    }

    return config.r2.bucket;
  };

  const getClient = (): S3Client => {
    if (client) {
      return client;
    }

    const { accountId, accessKeyId, secretAccessKey } = config.r2;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new UnknownError('storage.missingConfiguration');
    }

    client = new S3Client({
      // R2 has no regions, but the signer refuses to sign without one.
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    return client;
  };

  /**
   * Signs a single PUT for one object key.
   *
   * The signature pins the content type, so a URL obtained for a JPEG cannot
   * be used to store an HTML page under our own domain. `maxBytes` rides along
   * as object metadata instead of being enforced by the signature: a presigned
   * PUT can pin header values, not ranges — only a POST policy expresses
   * `content-length-range`. It is recorded so the bucket's lifecycle and any
   * later sweep can tell an oversized object from an expected one, and because
   * an object nobody confirms is garbage whatever its size.
   */
  const createPresignedUpload = async ({
    key,
    contentType,
    maxBytes = MAX_IMAGE_UPLOAD_BYTES,
  }: PresignedUploadInput): Promise<string> => {
    try {
      const command = new PutObjectCommand({
        Bucket: requireBucket(),
        Key: key,
        ContentType: contentType,
        Metadata: { 'max-bytes': String(maxBytes) },
      });

      return await getSignedUrl(getClient(), command, {
        expiresIn: UPLOAD_URL_TTL_SECONDS,
      });
    } catch (err: any) {
      if (err instanceof UnknownError) {
        throw err;
      }
      throw new UnknownError('storage.createPresignedUpload', err.stack);
    }
  };

  /**
   * The URL the app reads the image from. The bucket is served by a public
   * host (a custom domain or the r2.dev one), so reads need no signature and
   * can be cached by the client.
   */
  const publicUrlFor = (key: string): string => {
    if (!config.r2.publicBaseUrl) {
      throw new UnknownError('storage.missingConfiguration');
    }

    return `${config.r2.publicBaseUrl.replace(/\/+$/, '')}/${key}`;
  };

  return {
    createPresignedUpload,
    publicUrlFor,
  };
};

export type StorageGateway = ReturnType<typeof initStorageGateway>;
