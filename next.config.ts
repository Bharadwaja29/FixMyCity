import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

let supabaseHostname: string | undefined
let supabaseProtocol: 'http' | 'https' = 'https'

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl)
    supabaseHostname = parsed.hostname
    supabaseProtocol = parsed.protocol.replace(':', '') as 'http' | 'https'
  } catch {
    // Ignore invalid URL
  }
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Supabase hosted cloud storage (*.supabase.co)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
      // Project-specific Supabase URL (e.g. custom domain, localhost, or specific project ref)
      ...(supabaseHostname
        ? [
            {
              protocol: supabaseProtocol,
              hostname: supabaseHostname,
              pathname: '/storage/v1/**',
            },
          ]
        : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '30mb',
    },
  },
}

export default nextConfig
