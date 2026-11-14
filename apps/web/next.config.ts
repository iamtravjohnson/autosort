import type { NextConfig } from 'next';

// The app is per-user and reads cookies and the database on every request, so it renders
// dynamically (Cache Components off).
const nextConfig: NextConfig = {
  // The font used to draw playlist covers is read from disk at runtime.
  outputFileTracingIncludes: { '/**': ['./assets/fonts/**'] },
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
