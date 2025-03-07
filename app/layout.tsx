import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sloaner3D地球',
  description: '交互式三维地球展示系统',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
