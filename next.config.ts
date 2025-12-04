import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // keep these so TypeScript/ESLint don’t block builds
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns: [
      // placeholder images you were already using
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },

      // Firebase Storage — this is what fixes your new listing images
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname:
          '/v0/b/studio-4668517724-751eb.firebasestorage.app/o/**',
      },
    ],
  },
};

export default nextConfig;
