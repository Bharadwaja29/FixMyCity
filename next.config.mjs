/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

let supabaseHostname = undefined
let supabaseProtocol = 'https'

if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl)
    supabaseHostname = parsed.hostname
    supabaseProtocol = parsed.protocol.replace(':', '')
  } catch {}
}

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/**',
      },
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
