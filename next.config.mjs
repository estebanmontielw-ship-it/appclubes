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
  disableLogger: true,
})
