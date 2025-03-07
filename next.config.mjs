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
  output: 'export', // 静态导出
  reactStrictMode: false, // 关闭严格模式以减少重复渲染
  swcMinify: true, // 使用SWC压缩代替Terser
  experimental: {
    // 减少实验性功能
    optimizeCss: true,
    scrollRestoration: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // 生产环境移除console
  },
}

export default nextConfig 