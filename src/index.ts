import { assertConfigIsValid, config } from './libs/config';
import { initUsecases } from './usecases';
import { initLogger } from './libs/logger';
import express from 'express';
import http from 'http';
import { initGraphQL } from './graphql';
import { initDatabase } from './repositories/database/database';
import { initGateways } from './gateways';
import { initRepositories } from './repositories';
import { initEvents } from './libs/events';
import { startVotingSessionSweeper } from './libs/scheduler/voting-session-sweeper';
import { AppContext } from './libs/context';

const main = async () => {
  assertConfigIsValid(config);

  const logger = await initLogger(config);
  const db = initDatabase(config);
  const gateways = initGateways(config);
  const usecases = initUsecases();
  // One bus for the whole process: the sweeper publishes into the same
  // instance the WebSocket server subscribes to, or its closures reach nobody.
  const events = initEvents();

  // Create server
  const app = express();
  // Required for the rate limiter to see the client address rather than the
  // load balancer's when running behind one.
  app.set('trust proxy', 1);

  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = http.createServer(app);

  // Init GraphQL API
  const graphqlRouter = await initGraphQL(
    httpServer,
    config,
    db,
    logger,
    usecases,
    gateways,
    events,
  );
  app.use('/graphql', graphqlRouter);

  // The sweeper is the only actor that closes a session nobody touched. It
  // runs as the system, not as a user, so its context is unauthenticated and
  // its usecase never asks who the caller is.
  startVotingSessionSweeper((): AppContext => ({
    config,
    logger: logger.logger,
    repositories: initRepositories(db),
    gateways,
    events,
    auth: { isAuthenticated: false },
  }));

  // Start the server
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: config.port }, () => {
      logger.logger.info(`Server is running on port ${config.port}`);
      resolve();
    }),
  );
};

main().catch((error) => {
  console.error('Failed to start the server', error);
  process.exit(1);
});
