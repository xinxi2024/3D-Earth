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
    domains: [
      'threejs.org',
      'raw.githubusercontent.com'
    ],
  },
  trailingSlash: true,
  reactStrictMode: true,
  experimental: {
    // 减少实验性功能
    optimizeCss: false, // 禁用CSS优化以避免critters相关问题
  },
  // 添加编译器配置
  compiler: {
    styledComponents: true,
  },
  // 添加Webpack配置
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      path: false 
    }
    return config
  }
}

export default nextConfig 