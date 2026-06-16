import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'VietNamOnline',
  description:
    'Tổng hợp và chia sẻ base layout Clash of Clans theo Town Hall, chiến thuật Farming, War, Trophy và nhiều hơn nữa.',
  openGraph: {
    title: 'CoC Base Hub',
    description: 'Chia sẻ và tìm kiếm base CoC tốt nhất cho anh em VietNamOnline',
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
