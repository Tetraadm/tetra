/**
 * Redis Cache Module
 * 
 * Provides caching for expensive operations like:
 * - Vertex AI Search results
 * - AI responses (optional)
 * - Frequently accessed data
 */

import { Redis } from '@upstash/redis'
import { aiLogger, createTimer } from './logger'

// Configuration
const CACHE_TTL_SECONDS = parseInt(process.env.CACHE_TTL_SECONDS || '300', 10) // 5 minutes default
const SEARCH_CACHE_TTL = parseInt(process.env.SEARCH_CACHE_TTL || '60', 10) // 1 minute for search

// Lazy initialization
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN
    
    if (!url || !token) {
      aiLogger.debug('Redis not configured, caching disabled')
      return null
    }
    
    redis = new Redis({ url, token })
  }
  return redis
}

/**
 * Generate a cache key for search queries
 */
function generateSearchCacheKey(query: string, orgId?: string): string {
  // Normalize query for better cache hits
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, ' ')
  const prefix = orgId ? `search:${orgId}` : 'search:global'
  return `${prefix}:${normalizedQuery}`
}

/**
 * Get cached search results
 */
export async function getCachedSearchResults<T>(
  query: string,
  orgId?: string
): Promise<T | null> {
  const client = getRedis()
  if (!client) return null

  const timer = createTimer(aiLogger, 'cache_get')
  const key = generateSearchCacheKey(query, orgId)

  try {
    const cached = await client.get<T>(key)
    if (cached) {
      timer.end({ hit: true, key })
      aiLogger.debug({ key }, 'Cache hit')
      return cached
    }
    timer.end({ hit: false, key })
    return null
  } catch (error) {
    timer.fail(error, { key })
    return null
  }
}

/**
 * Cache search results
 */
export async function cacheSearchResults<T>(
  query: string,
  results: T,
  orgId?: string,
  ttl: number = SEARCH_CACHE_TTL
): Promise<void> {
  const client = getRedis()
  if (!client) return

  const timer = createTimer(aiLogger, 'cache_set')
  const key = generateSearchCacheKey(query, orgId)

  try {
    await client.set(key, results, { ex: ttl })
    timer.end({ key, ttl })
    aiLogger.debug({ key, ttl }, 'Cached search results')
  } catch (error) {
    timer.fail(error, { key })
  }
}

/**
 * Invalidate cache for an organization (e.g., when content changes)
 */
export async function invalidateOrgCache(orgId: string): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    // Get all keys matching the org prefix
    const keys = await client.keys(`search:${orgId}:*`)
    if (keys.length > 0) {
      await client.del(...keys)
      aiLogger.info({ orgId, keysDeleted: keys.length }, 'Organization cache invalidated')
    }
  } catch (error) {
    aiLogger.error({ error, orgId }, 'Failed to invalidate org cache')
  }
}

/**
 * Generic cache get/set
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null

  try {
    return await client.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL_SECONDS
): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.set(key, value, { ex: ttl })
  } catch {
    // Ignore cache errors
  }
}

/**
 * Check if caching is available
 */
export function isCacheEnabled(): boolean {
  return !!getRedis()
}
