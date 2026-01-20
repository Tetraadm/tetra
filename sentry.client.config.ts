import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Client Configuration
 * This file configures the Sentry SDK for the client-side (browser).
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SENTRY_DSN: Your Sentry DSN (get from sentry.io)
 */

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Replay is only available in the client
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,

    integrations: [
        Sentry.replayIntegration({
            // Additional Replay configuration goes in here
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],

    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',

    // Don't send errors for these URLs
    denyUrls: [
        // Chrome extensions
        /extensions\//i,
        /^chrome:\/\//i,
    ],

    // Ignore specific errors
    ignoreErrors: [
        // Network errors
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        // User cancelled
        'AbortError',
        'ResizeObserver loop',
    ],
});
