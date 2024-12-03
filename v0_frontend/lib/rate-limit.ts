import { LRUCache as LRU } from 'lru-cache';

export interface RateLimitOptions {
    interval: number;
    uniqueTokenPerInterval: number;
}

export interface RateLimitInfo {
    limit: number;
    current: number;
    remaining: number;
    reset: number;
}

export interface TokenData {
    count: number;
    timestamp: number;
}

export interface RateLimiter {
    check: (key: string, limit: number) => Promise<RateLimitInfo>;
}

export function rateLimit(options: RateLimitOptions): RateLimiter {
    const tokenCache = new LRU({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    });

    return {
        check: async (key: string, limit: number): Promise<RateLimitInfo> => {
            const now = Date.now();
            const windowStart = now - options.interval;
            
            const data = tokenCache.get(key) as TokenData | undefined;
            const currentData: TokenData = data 
                ? {
                    count: data.timestamp > windowStart ? data.count + 1 : 1,
                    timestamp: now
                }
                : { count: 1, timestamp: now };
            
            // Check if this request would exceed the limit
            if (currentData.count > limit) {
                const rateLimitInfo: RateLimitInfo = {
                    limit,
                    current: data?.count || 0,
                    remaining: 0,
                    reset: data ? data.timestamp + options.interval : now + options.interval
                };

                throw Object.assign(new Error('Rate limit exceeded'), {
                    code: 'RATE_LIMIT_EXCEEDED',
                    status: 429,
                    rateLimitInfo
                });
            }

            // Only update the cache if we're not rate limited
            tokenCache.set(key, currentData);

            const rateLimitInfo: RateLimitInfo = {
                limit,
                current: currentData.count,
                remaining: Math.max(0, limit - currentData.count),
                reset: currentData.timestamp + options.interval
            };

            return rateLimitInfo;
        },
    };
}
