import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Simple in-memory rate limiting for development
// For production, use Upstash Redis with env vars:
// UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN

class InMemoryRatelimit {
  private requests: Map<string, number[]> = new Map()
  private limit: number
  private window: number

  constructor(limit: number, window: number) {
    this.limit = limit
    this.window = window
  }

  async limit(identifier: string) {
    const now = Date.now()
    const timestamps = this.requests.get(identifier) || []

    // Remove old timestamps outside the window
    const validTimestamps = timestamps.filter(ts => now - ts < this.window)

    if (validTimestamps.length >= this.limit) {
      const oldestTimestamp = validTimestamps[0]
      const resetTime = oldestTimestamp + this.window
      return {
        success: false,
        limit: this.limit,
        remaining: 0,
        reset: resetTime,
      }
    }

    validTimestamps.push(now)
    this.requests.set(identifier, validTimestamps)

    return {
      success: true,
      limit: this.limit,
      remaining: this.limit - validTimestamps.length,
      reset: now + this.window,
    }
  }
}

// AI endpoint: 10 requests per minute
export const aiRatelimit = new InMemoryRatelimit(10, 60 * 1000)

// Upload endpoint: 5 uploads per minute
export const uploadRatelimit = new InMemoryRatelimit(5, 60 * 1000)

// Helper to get client IP
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}
