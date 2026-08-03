import bunyan from 'bunyan';
import express from 'express';
import * as lb from '@google-cloud/logging-bunyan';
import { Config, isProduction } from '../config';

export const initLogger = async (config: Config) => {
  let logger: bunyan;
  let middleware: express.RequestHandler;

  if (isProduction(config)) {
    // When running in production (with the Google Cloud project), use the Google Cloud Logging Bunyan middleware
    const gcpLogger = await lb.express.middleware({
      // Add your Google Cloud project configuration here
      projectId: config.gcp.projectId,
      credentials: {
        client_email: config.gcp.credentials.clientEmail,
        private_key: config.gcp.credentials.privateKey,
      },
    });

    logger = gcpLogger.logger;
    middleware = gcpLogger.mw;
  } else {
    // When running locally, use a local Bunyan logger
    logger = bunyan.createLogger({ name: 'local' });
    // Use a dummy middleware
    middleware = (_req, _res, next) => {
      next();
    };
  }

  return { logger, middleware };
};

export type InitLogger = Awaited<ReturnType<typeof initLogger>>;
