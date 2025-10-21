/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignore test files during production build
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on type errors (useful for development)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
