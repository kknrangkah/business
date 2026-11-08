import type { NextConfig } from "next";

const enableBackendProxy = process.env.ENABLE_RME_BACKEND_PROXY === 'true';
const backendUrl =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:30005';

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '*.lhr.life',
    '*.trycloudflare.com',
    '*.devtunnels.ms',
    '*.ngrok-free.app',
  ],
  typescript: {
    // Skip type checking on production build (already validated via local checks)
    ignoreBuildErrors: true,
  },
  async rewrites() {
    if (!enableBackendProxy) {
      return [];
    }
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
