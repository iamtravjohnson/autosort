import type { NextConfig } from 'next';

/**
 * Optional: serve AutoSort under a path on another site, e.g. BASE_PATH=/autosort with
 * APP_URL=https://example.com/autosort, and a rewrite on that site sending /autosort/* here.
 */
function normalizeBasePath(value: string | undefined): string {
  const trimmed = (value ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const basePath = normalizeBasePath(process.env.BASE_PATH);
const appUrl = process.env.APP_URL?.replace(/\/$/, '');
const appHost = appUrl ? new URL(appUrl).host : undefined;
// This deployment's own address, for the daily-sync rewrite below.
const selfOrigin = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : appUrl
    ? new URL(appUrl).origin
    : undefined;

// The app is per-user and reads cookies and the database on every request, so it renders
// dynamically (Cache Components off).
const nextConfig: NextConfig = {
  basePath,
  env: { AUTOSORT_BASE_PATH: basePath },
  // Shown through another site, Server Actions arrive with that site's Origin; allow it.
  ...(appHost ? { experimental: { serverActions: { allowedOrigins: [appHost] } } } : {}),
  async rewrites() {
    // Vercel Cron calls /api/sync (vercel.json), which sits outside the base path. Send it on.
    if (!basePath || !selfOrigin) return [];
    return [{ source: '/api/sync', destination: `${selfOrigin}${basePath}/api/sync`, basePath: false }];
  },
  // Read from disk at runtime: the font for playlist covers, and the update workflow (Settings).
  outputFileTracingIncludes: { '/**': ['./assets/fonts/**', './updater/**'] },
  serverExternalPackages: ['sharp'],
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
