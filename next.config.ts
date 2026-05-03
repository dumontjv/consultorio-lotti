import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  serverExternalPackages: [
    '@react-pdf/renderer',
    '@react-pdf/layout',
    '@react-pdf/stylesheet',
    '@react-pdf/font',
    '@react-pdf/pdfkit',
    '@react-pdf/fns',
  ],
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
