import * as dotenv from 'dotenv';
import Joi from 'joi';
dotenv.config();

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),
  graphql: {
    sandbox: process.env.GRAPHQL_SANDBOX === 'true',
    // Bounds on how much work a single document may request. See
    // graphql/validation for what each one rejects.
    maxDepth: toInt(process.env.GRAPHQL_MAX_DEPTH, 10),
    maxFields: toInt(process.env.GRAPHQL_MAX_FIELDS, 300),
  },
  rateLimit: {
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: toInt(process.env.RATE_LIMIT_MAX, 120),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  cors: {
    origin: process.env.CORS_ORIGIN?.split(','),
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    credentials: {
      clientId: process.env.GCP_CREDENTIALS_CLIENT_ID,
      clientEmail: process.env.GCP_CREDENTIALS_CLIENT_EMAIL,
      privateKey: (process.env.GCP_CREDENTIALS_PRIVATE_KEY ?? '')
        .split(String.raw`\n`)
        .join('\n'),
      type: process.env.GCP_CREDENTIALS_TYPE,
    },
    storage: {
      bucketName: process.env.GCP_STORAGE_BUCKET_NAME,
    },
  },
  // Cloudflare R2, where avatars and crests live. Left out of the boot-time
  // schema below: pictures are optional, so an unconfigured bucket must fail
  // the upload mutations, not the whole server.
  r2: {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucket: process.env.R2_BUCKET,
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    credentials: {
      clientEmail: process.env.FIREBASE_CREDENTIALS_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_CREDENTIALS_PRIVATE_KEY ?? '')
        .split(String.raw`\n`)
        .join('\n'),
    },
    client: {
      apiKey: process.env.FIREBASE_CLIENT_API_KEY,
      authDomain: process.env.FIREBASE_CLIENT_AUTH_DOMAIN,
      storageBucket: process.env.FIREBASE_CLIENT_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_CLIENT_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_CLIENT_APP_ID,
    },
  },
} as const;

export type Config = typeof config;

export const isProduction = (config: Config): boolean =>
  config.env === 'production';

const schema = Joi.object({
  env: Joi.string().valid('development', 'test', 'staging', 'production'),
  database: Joi.object({
    url: Joi.string()
      .uri({ scheme: [/postgres(ql)?/] })
      .required(),
  }).unknown(true),
  firebase: Joi.object({
    projectId: Joi.string().required(),
    credentials: Joi.object({
      clientEmail: Joi.string().email().required(),
      privateKey: Joi.string().min(1).required(),
    }).unknown(true),
    client: Joi.object({
      apiKey: Joi.string().required(),
    }).unknown(true),
  }).unknown(true),
  // A missing CORS_ORIGIN makes the `cors` package answer every origin with
  // `Access-Control-Allow-Origin: *`, so outside development it is required.
  cors: Joi.object({
    origin: Joi.when(Joi.ref('/env'), {
      is: 'development',
      then: Joi.array().items(Joi.string()).optional(),
      otherwise: Joi.array().items(Joi.string()).min(1).required(),
    }),
  }).unknown(true),
}).unknown(true);

/**
 * Fails the process at boot instead of at the first request that happens to
 * need a missing variable. Called from src/index.ts, never from tests, which
 * build their own partial config.
 */
export const assertConfigIsValid = (candidate: Config): void => {
  const { error } = schema.validate(candidate, { abortEarly: false });

  if (error) {
    const problems = error.details.map((detail) => detail.message).join('; ');
    throw new Error(`Invalid configuration: ${problems}`);
  }
};
