import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'VietNamOnline - COC Esports Clan',
  description:
    'Trang sinh hoạt chung của anh em Clan VietNamOnline. Tổng hợp base War/Legend, quản lý CWL và kết nối cộng đồng.',
  openGraph: {
    title: 'VietNamOnline - COC Esports Clan',
    description: 'Trang sinh hoạt chung của anh em Clan VietNamOnline. Tổng hợp base War/Legend, quản lý CWL và kết nối cộng đồng.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#252018',
              color: '#e8d9b8',
              border: '1px solid #3d3428',
            },
            success: {
              iconTheme: { primary: '#f59e0b', secondary: '#1a1612' },
            },
          }}
        />
      </body>
    </html>
  )
}
