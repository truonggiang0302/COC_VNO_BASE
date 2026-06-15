import { Suspense } from 'react'
import Image from 'next/image'
import type { BaseFilters } from '@/types'
import Header from '@/components/Header'
import FilterBar from '@/components/FilterBar'
import BaseGrid from '@/components/BaseGrid'
import BaseGridSkeleton from '@/components/BaseGridSkeleton'
import { Search, Shield } from 'lucide-react'

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  const search    = typeof params.search    === 'string' ? params.search    : undefined
  const townhall  = typeof params.townhall  === 'string' ? params.townhall  : undefined
  const base_type = typeof params.base_type === 'string' ? params.base_type : undefined

  const hasFilters = search || townhall || base_type

  const filters: BaseFilters = { search, townhall, base_type }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-stone-750 bg-gradient-to-b from-[#1e1810] via-[#1a1612] to-[#141210]">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-40 w-40 rounded-full border border-gold-800/10" />
          <div className="absolute -right-20 -bottom-20 h-60 w-60 rounded-full border border-gold-800/10" />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold-800/5" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:py-20">
          <div className="mx-auto mb-6 flex h-40 w-40 items-center justify-center">
            <div className="relative h-40 w-40 transition-transform hover:scale-110 duration-300">
              <Image
                src="/logo_vno.png"
                alt="CoC VNO Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
          <h1 className="gold-shimmer mb-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">
            VietNamOnline
          </h1>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-gold-800/30 to-transparent" />
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Filter Panel */}
        <div className="mb-8 rounded-2xl border border-stone-750 bg-gradient-to-b from-[#1a1612] to-[#161310] p-6 shadow-xl shadow-black/20">
          <FilterBar />
        </div>

        {/* Results */}
        {hasFilters ? (
          <Suspense fallback={<BaseGridSkeleton />}>
            <BaseGrid filters={filters} />
          </Suspense>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-stone-750 bg-stone-900/50">
              <Search className="h-8 w-8 text-stone-600" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-stone-400">
              Tìm kiếm base
            </h2>
            <p className="max-w-md text-sm text-stone-600">
              Sử dụng bộ lọc hoặc ô tìm kiếm bên trên để khám phá các base layout.
              Click vào các nút loại base hoặc Town Hall để lọc nhanh.
            </p>
          </div>
        )}
      </main>

      <footer className="border-t border-stone-750 py-8 text-center text-xs text-stone-600">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Shield className="h-4 w-4 text-gold-600" />
            <span className="text-gold-500 font-semibold">CoC VNO</span>
          </div>
          <p>© {new Date().getFullYear()} – Không liên kết với Supercell</p>
          <p className="mt-1">Clash of Clans là thương hiệu của Supercell Oy.</p>
        </div>
      </footer>
    </div>
  )
}