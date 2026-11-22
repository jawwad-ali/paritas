import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Sent with every page. No script-src policy: Next.js and the theme script
 * run inline, so this CSP only covers what cannot break them (framing, plugins,
 * base and form targets). HSTS takes effect once served over HTTPS.
 */
const SECURITY_HEADERS = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'",
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

/**
 * Server-side only. When set, /api/v1/* on this origin is forwarded to the API,
 * so the browser sees one site and the refresh cookie stays first-party (two
 * *.vercel.app projects are different sites, and browsers drop cross-site
 * cookies). Leave NEXT_PUBLIC_API_URL unset to use it.
 */
const apiProxyUrl = process.env.API_PROXY_URL?.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image; Vercel builds its own output.
  output: process.env.VERCEL ? undefined : 'standalone',
  // Trace from the monorepo root so workspace packages land in the bundle.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),
  poweredByHeader: false,
  headers: async () => [{ source: '/:path*', headers: SECURITY_HEADERS }],
  rewrites: async () =>
    apiProxyUrl ? [{ source: '/api/v1/:path*', destination: `${apiProxyUrl}/api/v1/:path*` }] : [],
  cacheComponents: true,
  partialPrefetching: true,
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
