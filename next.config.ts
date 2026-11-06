import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextIntlPlugin from 'next-intl/plugin';
import type { default as NextIntlPluginFn } from 'next-intl/plugin';

const createNextIntlPlugin =
  typeof nextIntlPlugin === 'function'
    ? nextIntlPlugin
    : (nextIntlPlugin as unknown as { default: NextIntlPluginFn }).default;

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: process.env.VERCEL ? undefined : 'standalone',
  compress: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['@okn/shared', 'motion'],
  serverExternalPackages: ['@coinbase/cdp-sdk', 'pino', 'pino-pretty'],
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif|woff2|woff|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/app/portfolio',
      },
      {
        source: '/portfolio',
        destination: '/app/portfolio',
      },
      {
        source: '/referral',
        destination: '/app/referral',
      },
      {
        source: '/polymarket-agent',
        destination: '/app/polymarket-agent',
      },
      {
        source: '/tasks',
        destination: '/app/tasks',
      },
      {
        source: '/claim',
        destination: '/app/claim',
      },
      {
        source: '/buy',
        destination: '/app/buy',
      },
      {
        source: '/leaderboard',
        destination: '/app/leaderboard',
      },
      {
        source: '/missions',
        destination: '/app/missions',
      },
      {
        source: '/staking',
        destination: '/app/staking',
      },
      {
        source: '/wallet',
        destination: '/app/wallet',
      },
      {
        source: '/trade-bot',
        destination: '/app/trade-bot',
      },
      {
        source: '/prediction-markets',
        destination: '/app/prediction-markets',
      },
      {
        source: '/settings',
        destination: '/app/settings',
      },
      {
        source: '/learn',
        destination: '/app/learn',
      },
      {
        source: '/news',
        destination: '/app/news',
      },
    ];
  },
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@okn/shared': path.resolve(projectRoot, 'src/shared/index.ts'),
      'pino-pretty': false,
      lokijs: false,
      encoding: false,
      '@react-native-async-storage/async-storage': false,
      '@base-org/account': false,
      '@metamask/connect-evm': false,
      '@walletconnect/ethereum-provider': false,
      accounts: false,
      'mppx/client': path.resolve(projectRoot, 'src/lib/empty-module.js'),
      '@solana/kit': path.resolve(projectRoot, 'src/lib/empty-module.js'),
      '@x402/evm': path.resolve(projectRoot, 'src/lib/empty-module.js'),
      '@x402/evm/upto/client': path.resolve(projectRoot, 'src/lib/empty-module.js'),
      '@x402/evm/exact/client': path.resolve(projectRoot, 'src/lib/empty-module.js'),
      '@x402/core/client': path.resolve(projectRoot, 'src/lib/empty-module.js'),
      '@x402/core/server': path.resolve(projectRoot, 'src/lib/empty-module.js'),
      '@x402/svm/exact/client': path.resolve(projectRoot, 'src/lib/empty-module.js'),
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
