import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // M-01: CSP is now handled by middleware with nonces
          // See src/middleware.ts for dynamic CSP generation
        ],
      },
    ];
  },

  // NOTE: www.tetrivo.com → tetrivo.com redirect is handled by Vercel Domains config

  images: {
    qualities: [75, 100],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Only upload source maps in production
  disable: process.env.NODE_ENV !== 'production',
};

// Wrap with Sentry
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
