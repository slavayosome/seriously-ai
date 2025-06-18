/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable transpilation of packages from the monorepo
  transpilePackages: ['@seriously-ai/shared'],
  
  // Experimental features
  experimental: {
    // Add experimental features as needed
  },

  // TypeScript configuration
  typescript: {
    // Don't fail the build if there are TypeScript errors
    // (useful during development, remove in production)
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Don't fail the build if there are ESLint errors
    // (useful during development, remove in production)
    ignoreDuringBuilds: false,
  },

  // Output configuration for potential static exports
  output: 'standalone',

  // Image configuration
  images: {
    remotePatterns: [
      // Add remote image patterns as needed
    ],
  },

  // Environment variables that should be available on the client side
  env: {
    // Add client-side environment variables here
  },

  // Headers configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 