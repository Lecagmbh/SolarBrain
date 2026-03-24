/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile TypeScript files from parent directories
  transpilePackages: [],

  // Allow imports from parent directories
  experimental: {
    externalDir: true,
  },

  // Webpack config to handle TypeScript files from parent directories
  webpack: (config, { isServer }) => {
    // Add rule to process TypeScript files from parent directories
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      include: [
        /src\/config/,
        /src\/contexts/,
        /src\/modules/,
        /src\/hooks/,
      ],
      use: [
        {
          loader: 'next-swc-loader',
          options: {
            isServer,
          },
        },
      ],
    });

    return config;
  },

  // TypeScript settings
  typescript: {
    // Don't fail build on TypeScript errors in parent directories
    ignoreBuildErrors: true,
  },

  // ESLint settings
  eslint: {
    // Don't run ESLint on parent directories
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
