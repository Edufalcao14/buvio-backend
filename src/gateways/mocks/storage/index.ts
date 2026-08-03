import { StorageGateway } from '../../storage';

/**
 * Deterministic stand-in for R2. Tests assert on the URLs, and the whole suite
 * must run with no bucket and no credentials configured, so nothing here ever
 * reaches the network.
 */
export const MOCK_STORAGE_PUBLIC_BASE_URL = 'https://images.buvio.test';

export const initStorageGatewayMock = (): StorageGateway => {
  return {
    createPresignedUpload: jest
      .fn()
      .mockImplementation(
        async ({ key }: { key: string }) =>
          `${MOCK_STORAGE_PUBLIC_BASE_URL}/${key}?signature=test`,
      ),
    publicUrlFor: jest
      .fn()
      .mockImplementation(
        (key: string) => `${MOCK_STORAGE_PUBLIC_BASE_URL}/${key}`,
      ),
  };
};
