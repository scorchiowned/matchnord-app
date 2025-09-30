import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/config.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: "/Users/markusanttila/Projects/Personal/tournament_software/matchnord-app",
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
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3000/api/v1/:path*',
      },
      {
        source: '/api/tournaments/:path*',
        destination: 'http://localhost:3000/api/tournaments/:path*',
      },
    ];
  },
  /* config options here */
};

export default withNextIntl(nextConfig);
