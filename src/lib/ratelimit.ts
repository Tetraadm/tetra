// Distributed rate limiting with Upstash Redis (production)
// Falls back to in-memory limiter if Upstash env vars are missing (dev)

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const parseEnvInt = (name: string, fallback: number, min = 1) => {
  const raw = process.env[name]
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN
  if (!Number.isFinite(parsed) || parsed < min) {
    return fallback
  }
  return parsed
}

// Environment configuration with defaults
const AI_RATE_LIMIT = parseEnvInt('AI_RATE_LIMIT', 20)
const AI_RATE_WINDOW_SECONDS = parseEnvInt('AI_RATE_WINDOW_SECONDS', 60)
const UPLOAD_RATE_LIMIT = parseEnvInt('UPLOAD_RATE_LIMIT', 10)
const UPLOAD_RATE_WINDOW_SECONDS = parseEnvInt('UPLOAD_RATE_WINDOW_SECONDS', 60)

// Check if Upstash is configured
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN
const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

// Standard response shape for both implementations
interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number // Unix timestamp in milliseconds
}

// In-memory fallback for development
class InMemoryRatelimit {
  private requests: Map<string, number[]> = new Map()
  private maxRequests: number
  private window: number

  constructor(limit: number, windowSeconds: number) {
    this.maxRequests = limit
    this.window = windowSeconds * 1000 // Convert to ms
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now()
    const timestamps = this.requests.get(identifier) || []

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < this.window)

    if (validTimestamps.length >= this.maxRequests) {
      const oldestTimestamp = validTimestamps[0]
      const resetTime = oldestTimestamp + this.window
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: resetTime,
      }
    }

    validTimestamps.push(now)
    this.requests.set(identifier, validTimestamps)

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validTimestamps.length,
      reset: now + this.window,
    }
  }
}

// Upstash wrapper to normalize response shape
class UpstashRatelimitWrapper {
  private ratelimit: Ratelimit
  private maxRequests: number

  constructor(redis: Redis, limit: number, windowSeconds: number, prefix: string) {
    this.maxRequests = limit
    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix,
      analytics: true,
    })
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const result = await this.ratelimit.limit(identifier)
    return {
      success: result.success,
      limit: this.maxRequests,
      remaining: result.remaining,
      reset: result.reset, // Upstash returns Unix timestamp in ms
    }
  }
}

// Create rate limiters based on environment
function createRateLimiters() {
  if (useUpstash) {
    const redis = new Redis({
      url: UPSTASH_URL!,
      token: UPSTASH_TOKEN!,
    })

    return {
      aiRatelimit: new UpstashRatelimitWrapper(
        redis,
        AI_RATE_LIMIT,
        AI_RATE_WINDOW_SECONDS,
        'ratelimit:ai'
      ),
      uploadRatelimit: new UpstashRatelimitWrapper(
        redis,
        UPLOAD_RATE_LIMIT,
        UPLOAD_RATE_WINDOW_SECONDS,
        'ratelimit:upload'
      ),
    }
  }

  // Fallback when Upstash is not configured
  if (process.env.NODE_ENV === 'production') {
    console.warn('[ratelimit] Upstash not configured; falling back to in-memory rate limiter.')
  } else {
    console.log('[ratelimit] Using in-memory rate limiter (Upstash not configured)')
  }

  return {
    aiRatelimit: new InMemoryRatelimit(AI_RATE_LIMIT, AI_RATE_WINDOW_SECONDS),
    uploadRatelimit: new InMemoryRatelimit(UPLOAD_RATE_LIMIT, UPLOAD_RATE_WINDOW_SECONDS),
  }
}

const limiters = createRateLimiters()

export const aiRatelimit = limiters.aiRatelimit
export const uploadRatelimit = limiters.uploadRatelimit

// Helper to get client IP with improved robustness
export function getClientIp(request: Request): string {
  // Common proxy headers (in order of preference)
  const headers = [
    'cf-connecting-ip',    // Cloudflare
    'x-real-ip',           // Nginx
    'x-forwarded-for',     // Standard proxy header
  ]

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      // x-forwarded-for can contain multiple IPs: "client, proxy1, proxy2"
      const ip = value.split(',')[0].trim()
      // Basic validation: non-empty and no obvious injection
      if (ip && ip.length < 46 && /^[\d.:a-fA-F]+$/.test(ip)) {
        return ip
      }
    }
  }

  return 'unknown'
}
