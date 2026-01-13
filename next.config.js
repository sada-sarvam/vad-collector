/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  images: {
    domains: ['localhost'],
  },
  // Enable edge runtime for API routes if needed
  // runtime: 'edge',
}

module.exports = nextConfig
