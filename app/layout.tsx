import type { Metadata } from 'next'
import './globals.css'

// 这个文件不会被使用，我们正在使用Pages Router
// 但我们保留它以便导入全局样式
export const metadata: Metadata = {
  title: 'Sloaner3D地球',
  description: '交互式三维地球展示系统',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
