import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              // Base restrictions
              "default-src 'self'",

              // Scripts: unsafe-inline required for Next.js until nonce implementation
              // ROADMAP: Implement nonce-based CSP via next.config.js experimental.cspNonce
              // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers#content-security-policy
              "script-src 'self' 'unsafe-inline'",

              // Styles: unsafe-inline required for styled-components/emotion/inline styles
              // ROADMAP: Move to CSS modules or extract styles to external files
              "style-src 'self' 'unsafe-inline'",

              // Images: allow self, data URLs, and HTTPS (for Supabase storage)
              "img-src 'self' data: https:",

              // Fonts: self and data URLs only
              "font-src 'self' data:",

              // Connections: Supabase API and realtime
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com",

              // Block all frame embedding
              "frame-ancestors 'none'",

              // Additional restrictions (tightened from default)
              "object-src 'none'",           // Block plugins (Flash, Java, etc.)
              "base-uri 'self'",             // Prevent base tag injection
              "form-action 'self' https://*.supabase.co",          // Allow Supabase
              "upgrade-insecure-requests",   // Force HTTPS
            ].join('; ')
          },
        ],
      },
    ];
  },

  // NOTE: www.tetrivo.com → tetrivo.com redirect is handled by Vercel Domains config

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
