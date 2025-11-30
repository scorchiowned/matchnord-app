import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: process.cwd(),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'matchnordstorage.blob.core.windows.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.azure.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // Use production API URL if set, otherwise use localhost for development
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
      {
        source: '/api/tournaments/:path*',
        destination: `${apiUrl}/api/tournaments/:path*`,
      },
    ];
  },
  experimental: {
    externalDir: true,
  },
  /* config options here */
};

export default withNextIntl(nextConfig);
