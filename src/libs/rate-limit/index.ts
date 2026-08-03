import { RequestHandler } from 'express';

export type RateLimitOptions = {
  windowMs: number;
  max: number;
};

/**
 * Fixed-window per-IP request limiter.
 *
 * Deliberately dependency-free and in-memory, which means the budget is *per
 * process*: with N instances the effective limit is N x max. It exists to make
 * the brute-forceable surfaces (5-character team codes, `isEmailTaken`,
 * sign-in) expensive rather than free. Move it to a shared store before
 * scaling out if the limit needs to be exact.
 */
export const rateLimit = (options: RateLimitOptions): RequestHandler => {
  const hits = new Map<string, { count: number; resetAt: number }>();

  const sweep = (now: number) => {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  };

  return (req, res, next) => {
    const now = Date.now();

    // Cheap enough to run on the request path and keeps the map from growing
    // with every distinct client address seen since boot.
    if (hits.size > 10_000) {
      sweep(now);
    }

    const key = req.ip ?? req.socket.remoteAddress ?? 'unknown';
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    entry.count += 1;

    if (entry.count > options.max) {
      res
        .status(429)
        .set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
        .json({
          errors: [
            {
              message: 'AUTH_RATE_LIMITED',
              extensions: {
                code: 'TOO_MANY_REQUESTS',
                errorCode: 'AUTH_RATE_LIMITED',
                status: 429,
              },
            },
          ],
        });
      return;
    }

    next();
  };
};
