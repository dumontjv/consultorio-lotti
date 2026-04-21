import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

export default nextConfig
