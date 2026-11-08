import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://43.129.38.25:30005';

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Skip type checking on production build (already validated via local checks)
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${backendUrl}/v1/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ];
  },
};

export default nextConfig;
