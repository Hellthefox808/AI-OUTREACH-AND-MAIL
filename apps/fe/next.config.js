/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@career-intelligence/ui', '@career-intelligence/shared'],
};

module.exports = nextConfig;
