// Simple in-memory rate limiter for Next.js route handlers

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const tracker = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically to prevent memory leaks
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

/**
 * Rate limit a client request by IP.
 * @param ip Client IP address.
 * @param limit Maximum allowed requests within the window.
 * @param windowMs Time window in milliseconds.
 */
export function rateLimit(ip: string, limit: number, windowMs: number): RateLimitResult {
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
