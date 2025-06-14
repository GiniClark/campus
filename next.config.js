// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["ipfs-utils"],
  },
  reactStrictMode: true,
  // Ignoring typescript/eslint errors during build (deploy won't fail even if there are errors)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    // config.resolve.alias = {
    //   ...config.resolve.alias,
    //   'react-reconciler': 'react-reconciler/cjs/react-reconciler.development.js',
    //   'scheduler/tracing': 'scheduler/tracing-profiling'
    // };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  images: {
    domains: ['ipfs.io'],
  },
};

module.exports = nextConfig;
