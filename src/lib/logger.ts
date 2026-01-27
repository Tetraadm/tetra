/**
 * Structured Logging Module
 * 
 * Uses pino for high-performance structured logging.
 * In production: JSON format (compatible with Cloud Logging)
 * In development: Console format for readability
 */

import pino from 'pino'

const isDev = process.env.NODE_ENV === 'development'

// Create base logger with simple configuration
// Note: pino-pretty transport is not used to avoid build issues
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  formatters: {
    level: (label) => ({ severity: label.toUpperCase() }),
  },
  messageKey: 'message',
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  base: {
    service: 'tetrivo',
  },
})

// Create child loggers for different modules
export const createLogger = (module: string) => logger.child({ module })

// Pre-configured module loggers
export const apiLogger = createLogger('api')
export const authLogger = createLogger('auth')
export const storageLogger = createLogger('storage')
export const aiLogger = createLogger('ai')
export const dbLogger = createLogger('db')

// Utility for logging errors with stack traces
export function logError(log: pino.Logger, error: unknown, context?: Record<string, unknown>) {
  if (error instanceof Error) {
    log.error({
      err: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      ...context
    }, error.message)
  } else {
    log.error({ err: error, ...context }, 'Unknown error')
  }
}

// Utility for timing operations
export function createTimer(log: pino.Logger, operation: string) {
  const start = Date.now()
  return {
    end: (context?: Record<string, unknown>) => {
      const duration = Date.now() - start
      log.info({ operation, duration_ms: duration, ...context }, `${operation} completed`)
      return duration
    },
    fail: (error: unknown, context?: Record<string, unknown>) => {
      const duration = Date.now() - start
      logError(log, error, { operation, duration_ms: duration, ...context })
      return duration
    }
  }
}

export default logger
