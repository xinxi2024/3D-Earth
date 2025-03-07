export function middleware() {
  // 这是一个空白中间件，仅用于确保Next.js静态导出工作正常
}

export const config = {
  matcher: [
    /*
     * 匹配所有除了以下路径之外的路径:
     * - 静态文件 (如 /static/ 下的文件)
     * - 公共文件 (如 favicon.ico)
     * - API 路由 (/api/)
     */
    '/((?!_next/static|_next/image|favicon.ico|assets/|public/).*)',
  ],
}; 