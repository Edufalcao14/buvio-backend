import express, { Router } from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import cors from 'cors';
import http from 'http';
import { readFile } from 'fs/promises';
import path from 'path';
import { InitLogger } from '../libs/logger';
import { Usecases } from '../usecases';
import { initResolvers } from './resolvers';
import { Events } from '../libs/events';
import { errorFormatter } from './errors/error-formatter';
import { initRepositories } from '../repositories';
import { Kysely } from 'kysely';
import { DB } from '../repositories/database/models';
import { AppContext, AuthContext } from '../libs/context';
import { Config, isProduction } from '../libs/config';
import { errorLoggingPlugin } from './errors/error-logging-plugin';
import { Gateways } from '../gateways';
import { depthLimitRule } from './validation/depth-limit';
import { complexityLimitRule } from './validation/complexity-limit';
import { rateLimit } from '../libs/rate-limit';
import { WebSocketServer } from 'ws';
// The runtime entry point is `graphql-ws/use/ws`; this project's
// moduleResolution predates package exports maps, so the types are pulled from
// the file that entry point resolves to.
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { useServer } from 'graphql-ws/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';

export const initGraphQL = async (
  httpServer: http.Server,
  config: Config,
  db: Kysely<DB>,
  logger: InitLogger,
  usecases: Usecases,
  gateways: Gateways,
  events: Events,
): Promise<Router> => {
  const router = Router();

  const typeDefs = await readFile(
    path.join(__dirname, '/schema.graphql'),
    'utf8',
  );

  // Introspection, the sandbox landing page and stack traces in error
  // extensions are all development affordances. GRAPHQL_SANDBOX can turn them
  // on outside production, but never in it.
  const developmentAffordances =
    config.graphql.sandbox && !isProduction(config);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers: initResolvers(usecases),
  });

  const server = new ApolloServer<AppContext>({
    nodeEnv: developmentAffordances ? 'development' : 'production',
    introspection: developmentAffordances,
    schema,
    validationRules: [
      depthLimitRule(config.graphql.maxDepth),
      complexityLimitRule(config.graphql.maxFields),
    ],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        // Without this the process keeps open sockets alive on shutdown.
        async serverWillStart() {
          return {
            async drainServer() {
              await wsCleanup.dispose();
            },
          };
        },
      },
      errorLoggingPlugin(logger.logger),
    ],
    formatError: errorFormatter,
  });

  // Subscriptions share the schema, the resolvers and the auth rules with the
  // HTTP endpoint; only the transport differs. The token arrives once, in the
  // connection params, because a socket authenticates when it opens.
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const wsCleanup = useServer(
    {
      schema,
      context: async (ctx: {
        connectionParams?: Record<string, unknown>;
      }): Promise<AppContext> => {
        const token = (ctx.connectionParams?.authorization ??
          ctx.connectionParams?.Authorization) as string | undefined;

        let auth: AuthContext = { isAuthenticated: false };

        if (token) {
          auth = await gateways.iam.getAuthAndValidateToken(
            stripBearerPrefix(token),
          );
        }

        return {
          config,
          logger: logger.logger,
          repositories: initRepositories(db),
          gateways,
          events,
          auth,
        };
      },
    },
    wsServer,
  );

  await server.start();

  // Middlewares
  router.use(
    cors<cors.CorsRequest>({
      methods: ['GET', 'POST', 'OPTIONS'],
      origin: config.cors.origin,
    }),
    rateLimit(config.rateLimit),
    express.json({ limit: '100kb' }),
    logger.middleware,
    expressMiddleware(server, {
      context: async ({ req }): Promise<AppContext> => {
        let auth: AuthContext = {
          isAuthenticated: false,
        };

        // Any Authorization header present is validated, full stop. Skipping
        // validation for a client-chosen operationName (it used to exempt
        // "IntrospectionQuery") let a caller bypass signature, expiry and
        // revocation checks just by naming their operation.
        const authHeader = req.headers.authorization;
        if (authHeader) {
          auth = await gateways.iam.getAuthAndValidateToken(
            stripBearerPrefix(authHeader),
          );
        }

        return {
          config,
          logger: logger.logger,
          repositories: initRepositories(db),
          gateways,
          events,
          auth,
        };
      },
    }),
  );

  return router;
};

const stripBearerPrefix = (authHeader: string): string =>
  authHeader.replace(/^Bearer /i, '');
