/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Temporarily ignore linting during builds for deployment
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Don't fail build on type errors (useful for development)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
