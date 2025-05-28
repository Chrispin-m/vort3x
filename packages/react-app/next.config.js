/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
   typescript: {
    ignoreBuildErrors: false, // ⚠️ Disables type checking during build
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
    };
    return config;
  },

  images: {
    domains: ['cdn-production-opera-website.operacdn.com'],
  },
};

module.exports = nextConfig;