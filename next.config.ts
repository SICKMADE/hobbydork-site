// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    remotePatterns: [
      // Firebase Storage (default API domain)
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      // Your project-specific Storage domain
      {
        protocol: 'https',
        hostname: 'studio-4668517724-751eb.firebasestorage.app',
        pathname: '/o/**',
      },
      // Unsplash avatars, etc.
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
