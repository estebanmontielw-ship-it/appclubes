import { withSentryConfig } from "@sentry/nextjs"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rielewpafughdpzlnkxr.supabase.co',
        port: '',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // Report-only CSP — not enforced, used to detect violations without breaking the app
          { key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'" },
        ],
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Upload source maps solo si hay auth token
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Ocultar source maps del cliente en producción
  hideSourceMaps: true,

  // No ampliar el bundle si no hay DSN configurado
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
})
