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

export default nextConfig
