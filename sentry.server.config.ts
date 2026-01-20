import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Server Configuration
 * This file configures the Sentry SDK for the server-side (Node.js).
 * 
 * Environment variables required:
 * - NEXT_PUBLIC_SENTRY_DSN: Your Sentry DSN
 */

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Adjust this value in production
    tracesSampleRate: 0.1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Only enable in production
    enabled: process.env.NODE_ENV === 'production',

    // Ignore specific errors
    ignoreErrors: [
        'Network request failed',
        'NEXT_NOT_FOUND',
    ],
});
