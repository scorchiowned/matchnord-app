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
  /* config options here */
};

export default withNextIntl(nextConfig);
