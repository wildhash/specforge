/**
 * SpecForge — Next.js Configuration
 * TASK-009 | Owner: architect
 * Version: 1.0 | Date: 2026-03-02
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.BUILD_MODE === 'export' ? 'export' : undefined,
  basePath: process.env.BUILD_MODE === 'export' ? '/specforge' : '',
  images: {
    unoptimized: process.env.BUILD_MODE === 'export',
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: false,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    SPECFORGE_MAX_REVISIONS: process.env.SPECFORGE_MAX_REVISIONS ?? '3',
    SPECFORGE_RUN_TIMEOUT_MS: process.env.SPECFORGE_RUN_TIMEOUT_MS ?? '300000',
    DEMO_MODE: process.env.DEMO_MODE ?? 'false',
  },
};

module.exports = nextConfig;
