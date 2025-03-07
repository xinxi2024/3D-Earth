/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  reactStrictMode: false,
  swcMinify: true,
  experimental: {
    // 减少实验性功能
    optimizeCss: false, // 禁用CSS优化以避免critters相关问题
  },
}

export default nextConfig 