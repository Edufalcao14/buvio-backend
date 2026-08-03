/**
 * jest globalTeardown: stops the container started by before-all.ts. It runs in
 * the same process, so the started container is still reachable on globalThis.
 */
export default async (): Promise<void> => {
  const container = globalThis.__BUVIO_TEST_CONTAINER__;

  if (!container) {
    return;
  }

  console.log('🛑 Stopping the test database container...');
  await container.stop();
  globalThis.__BUVIO_TEST_CONTAINER__ = undefined;
};
