/**
 * SpecForge — Next.js Configuration
 * TASK-009 | Owner: architect
 * Version: 1.0 | Date: 2026-03-02
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    SPECFORGE_MAX_REVISIONS: process.env.SPECFORGE_MAX_REVISIONS ?? '3',
    SPECFORGE_RUN_TIMEOUT_MS: process.env.SPECFORGE_RUN_TIMEOUT_MS ?? '300000',
  },
};

module.exports = nextConfig;
