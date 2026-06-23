// Shared/persistent rate limiter with fallback to in-memory
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const tracker = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically to prevent memory leaks (for in-memory fallback)
if (typeof window === "undefined") {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(ip);
      }
    }
  }, 60000);

  // Prevent keeping the Node process alive in tests/scripts
  if (interval && typeof interval.unref === "function") {
    interval.unref();
  }
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
};

// Cache of Ratelimit instances by limit + windowMs
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}-${windowMs}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    // Redis.fromEnv() automatically reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
    const redis = Redis.fromEnv();
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: true,
      prefix: "@upstash/ratelimit",
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

/**
 * Rate limit a client request by IP.
 * @param ip Client IP address.
 * @param limit Maximum allowed requests within the window.
 * @param windowMs Time window in milliseconds.
 */
export async function rateLimit(
  ip: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const hasUpstashConfig =
    Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
    Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

  if (hasUpstashConfig) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs);
      const result = await limiter.limit(ip);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.reset,
      };
    } catch (err) {
      console.error(
        "[RateLimiter] Upstash Redis error, falling back to in-memory rate limiting:",
        err
      );
    }
  }

  // Fallback to in-memory rate limiter
  const now = Date.now();
  const record = tracker.get(ip);

  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    tracker.set(ip, newRecord);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetTime: newRecord.resetTime,
    };
  }

  if (record.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - record.count,
    resetTime: record.resetTime,
  };
}
