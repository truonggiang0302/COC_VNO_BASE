import type { Metadata } from 'next'
import Link from 'next/link'
import { Flame, RefreshCw } from 'lucide-react'
import { getTrendingBases } from '@/lib/clashfox'
import TrendingBaseCard from '@/components/TrendingBaseCard'

export const metadata: Metadata = {
  title: 'Trending Bases | CoC VNO Base Hub',
  description: 'Các base Clash of Clans đang hot nhất hiện nay (nguồn: ClashFox)',
}

// Revalidate cả trang mỗi 1 giờ (khớp với cache trong lib/clashfox.ts)
export const revalidate = 3600

export default async function TrendingPage() {
  let bases: Awaited<ReturnType<typeof getTrendingBases>> = []
  let error: string | null = null

  try {
    bases = await getTrendingBases()
    if (bases.length === 0) {
      error = 'Không tải được dữ liệu trending từ nguồn. Vui lòng thử lại sau.'
    }
  } catch {
    error = 'Không tải được dữ liệu trending từ nguồn. Vui lòng thử lại sau.'
  }

  return (
    <main className="min-h-screen bg-stone-950">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Page header */}
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-gold-500" />
            <h1 className="gold-shimmer text-2xl font-bold">Trending Bases</h1>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-stone-500">
            Các base đang hot nhất hiện tại · Cập nhật mỗi 1 giờ · Nguồn:{' '}
            <a
              href="https://clashfox.com/trending-bases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-500 hover:text-gold-400"
            >
              ClashFox
            </a>
          </p>
        </div>

        {error ? (
          /* Fallback khi không tải được dữ liệu */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <RefreshCw className="mb-4 h-12 w-12 text-stone-700" />
            <h3 className="mb-2 text-lg font-semibold text-stone-400">
              Không tải được dữ liệu trending
            </h3>
            <p className="text-sm text-stone-600">{error}</p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-stone-500">
              Có <span className="font-semibold text-gold-500">{bases.length}</span> base đang
              thịnh hành
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {bases.map((base) => (
                <TrendingBaseCard key={base.detailPath} base={base} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}
