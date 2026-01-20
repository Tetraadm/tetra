import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Edge Configuration
 * This file configures the Sentry SDK for Edge Runtime (middleware, edge functions).
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
});
